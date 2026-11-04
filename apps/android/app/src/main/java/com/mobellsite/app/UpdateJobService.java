package com.mobellsite.app;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.util.Log;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 后台周期任务（APP-SPEC 8 节）：每 15min（系统最小值）检查站点 _hash 与软件更新，
 * 只做检查 + 发通知，不拉网页。
 */
public class UpdateJobService extends JobService {

    private static final String TAG = "MobellSiteJob";
    private ExecutorService executor;

    @Override
    public boolean onStartJob(final JobParameters params) {
        if (executor == null) {
            executor = Executors.newSingleThreadExecutor(r -> {
                Thread t = new Thread(r, "mobellsite-job");
                t.setDaemon(true);
                return t;
            });
        }
        executor.execute(() -> {
            Context app = getApplicationContext();
            try {
                SiteUpdateChecker.runCheck(app);
            } catch (Throwable t) {
                Log.w(TAG, "site check failed", t);
            }
            try {
                State state = new State(app);
                long last = state.appLastCheckAt();
                if (last == 0 || System.currentTimeMillis() - last >= Config.APP_CHECK_INTERVAL_MS) {
                    AppUpdateChecker.runCheck(app, true);
                }
            } catch (Throwable t) {
                Log.w(TAG, "app check failed", t);
            }
            jobFinished(params, false);
        });
        // 返回 true：工作在自己的线程里执行，完成后调用 jobFinished
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        // 任务被打断，不需要重新调度（周期任务仍会按期触发）
        return false;
    }

    @Override
    public void onDestroy() {
        if (executor != null) {
            executor.shutdown();
            executor = null;
        }
        super.onDestroy();
    }

    /** 排程周期任务（幂等：已存在则不重复排程）。 */
    public static void schedule(Context context) {
        try {
            JobScheduler scheduler =
                    (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            if (scheduler == null) {
                return;
            }
            if (scheduler.getPendingJob(Config.JOB_ID) != null) {
                return;
            }
            JobInfo job = new JobInfo.Builder(
                    Config.JOB_ID, new ComponentName(context, UpdateJobService.class))
                    .setPeriodic(Config.JOB_PERIOD_MS)
                    .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                    .setPersisted(true)
                    .build();
            int result = scheduler.schedule(job);
            if (result != JobScheduler.RESULT_SUCCESS) {
                Log.w(TAG, "JobScheduler.schedule returned " + result);
            }
        } catch (Throwable t) {
            Log.w(TAG, "schedule failed", t);
        }
    }
}
