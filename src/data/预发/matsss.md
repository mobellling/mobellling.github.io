## 4. 不定积分

求导是"已知函数求变化率"，积分是反过来："已知变化率，还原函数"。所以积分的基本功就是**把求导公式倒着背熟**，再学会凑。

### 4.1 原函数与不定积分

若在区间 $I$ 上 $F'(x)=f(x)$，称 $F$ 是 $f$ 在 $I$ 上的一个原函数。若 $F$ 是原函数，则 $F(x)+C$ 全是原函数，且 $f$ 的**任意两个原函数只差一个常数**。

$f$ 的全体原函数称为不定积分，记

$$
\int f(x)\,dx=F(x)+C
$$

**证（任意两个原函数只差常数）.** 设 $F'(x)=G'(x)=f(x)$，则 $\left[F(x)-G(x)\right]'=0$，由拉格朗日中值定理的推论，导数恒为零的函数是常数。

**基本性质.**（由求导运算的线性性反推）

$$
\left(\int f(x)\,dx\right)'=f(x),\qquad \int f'(x)\,dx=f(x)+C
$$

$$
\int\left[\alpha f(x)+\beta g(x)\right]dx=\alpha\int f(x)\,dx+\beta\int g(x)\,dx
$$

**理解.** 不定积分的结果必须带 $+C$，这是最容易丢分的地方；但对定积分和变限积分来说常数会被消掉。

### 4.2 基本积分表

$$
\int x^{\mu}\,dx=\frac{x^{\mu+1}}{\mu+1}+C\ (\mu\neq -1),\qquad \int\frac{1}{x}\,dx=\ln|x|+C
$$

$$
\int a^x\,dx=\frac{a^x}{\ln a}+C,\qquad \int e^x\,dx=e^x+C
$$

$$
\int\sin x\,dx=-\cos x+C,\qquad \int\cos x\,dx=\sin x+C
$$

$$
\int\sec^2 x\,dx=\tan x+C,\qquad \int\csc^2 x\,dx=-\cot x+C
$$

$$
\int\sec x\tan x\,dx=\sec x+C,\qquad \int\csc x\cot x\,dx=-\csc x+C
$$

$$
\int\frac{dx}{1+x^2}=\arctan x+C,\qquad \int\frac{dx}{\sqrt{1-x^2}}=\arcsin x+C
$$

$$
\int\tan x\,dx=-\ln|\cos x|+C,\qquad \int\cot x\,dx=\ln|\sin x|+C
$$

$$
\int\sec x\,dx=\ln|\sec x+\tan x|+C,\qquad \int\csc x\,dx=\ln|\csc x-\cot x|+C
$$

$$
\int\frac{dx}{a^2+x^2}=\frac{1}{a}\arctan\frac{x}{a}+C,\qquad \int\frac{dx}{\sqrt{a^2-x^2}}=\arcsin\frac{x}{a}+C\ (a>0)
$$

$$
\int\frac{dx}{x^2-a^2}=\frac{1}{2a}\ln\left|\frac{x-a}{x+a}\right|+C,\qquad \int\frac{dx}{\sqrt{x^2\pm a^2}}=\ln\left|x+\sqrt{x^2\pm a^2}\right|+C
$$

**推导（几个"不显然"的公式怎么来）.** $\int\tan x\,dx=\int\frac{\sin x}{\cos x}dx$，令 $u=\cos x$，$du=-\sin x\,dx$，得 $-\ln|\cos x|+C$。$\int\sec x\,dx$ 是分子分母同乘 $\sec x+\tan x$ 后凑成 $\frac{(\sec x+\tan x)'}{\sec x+\tan x}$。

$$
\int\frac{dx}{a^2+x^2}\ \ \xrightarrow{x=a\tan t}\ \ \int\frac{a\sec^2 t\,dt}{a^2\sec^2 t}=\frac{1}{a}t+C=\frac{1}{a}\arctan\frac{x}{a}+C
$$

$$
\int\frac{dx}{\sqrt{a^2-x^2}}\ \ \xrightarrow{x=a\sin t}\ \ \int\frac{a\cos t\,dt}{a\cos t}=t+C=\arcsin\frac{x}{a}+C
$$

### 4.3 换元积分法

#### 4.3.1 第一类换元法（凑微分）

若 $\int f(u)\,du=F(u)+C$，则

$$
\int f\left[\varphi(x)\right]\varphi'(x)\,dx=\int f(u)\,du\Big|_{u=\varphi(x)}=F\left[\varphi(x)\right]+C
$$

**推导.** 设 $F'(u)=f(u)$。由链式法则

$$
\frac{d}{dx}F\left[\varphi(x)\right]=F'\left[\varphi(x)\right]\varphi'(x)=f\left[\varphi(x)\right]\varphi'(x)
$$

两边积分即得。

**理解.** 就是把 $\varphi'(x)\,dx$ 看成 $d\varphi(x)$，硬凑成 $du$。常见凑法：

$$
\int f(ax+b)\,dx=\frac{1}{a}\int f(u)\,du,\qquad \int\frac{\varphi'(x)}{\varphi(x)}dx=\ln|\varphi(x)|+C
$$

$$
\int f(x^2)x\,dx=\frac{1}{2}\int f(u)\,du,\qquad \int f(e^x)e^x\,dx=\int f(u)\,du
$$

#### 4.3.2 第二类换元法（换掉 $x$）

设 $x=\psi(t)$ 单调可导且 $\psi'(t)\neq 0$，则

$$
\int f(x)\,dx=\int f\left[\psi(t)\right]\psi'(t)\,dt\Big|_{t=\psi^{-1}(x)}
$$

**推导.** 设右端原函数为 $\Phi(t)$，即 $\Phi'(t)=f\left[\psi(t)\right]\psi'(t)$。考虑 $F(x)=\Phi\left[\psi^{-1}(x)\right]$，由链式法则和反函数求导

$$
F'(x)=\Phi'(t)\cdot\frac{dt}{dx}=f\left[\psi(t)\right]\psi'(t)\cdot\frac{1}{\psi'(t)}=f(x)
$$

**常用三角代换**（依据 $\sin^2+\cos^2=1$、$1+\tan^2=\sec^2$）：

- 含 $\sqrt{a^2-x^2}$：令 $x=a\sin t$，$|t|\le\frac{\pi}{2}$
- 含 $\sqrt{a^2+x^2}$：令 $x=a\tan t$，$|t|<\frac{\pi}{2}$
- 含 $\sqrt{x^2-a^2}$：令 $x=a\sec t$

**例.** $\int\sqrt{a^2-x^2}\,dx$ 令 $x=a\sin t$：

$$
\int a\cos t\cdot a\cos t\,dt=a^2\int\cos^2 t\,dt=\frac{a^2}{2}\left(t+\frac{\sin 2t}{2}\right)+C=\frac{a^2}{2}\arcsin\frac{x}{a}+\frac{x}{2}\sqrt{a^2-x^2}+C
$$

这里用了 $\sin 2t=2\sin t\cos t=2\cdot\frac{x}{a}\cdot\frac{\sqrt{a^2-x^2}}{a}$。

**易错点.** 第二类换元最后一定要**换回** $x$；用 $\sqrt{u^2}=|u|$ 时要注意开方出来的符号，例如 $\sqrt{a^2-x^2}=a\cos t$ 需要 $t\in\left[-\frac{\pi}{2},\frac{\pi}{2}\right]$ 才有 $\cos t\ge 0$。

### 4.4 分部积分法

$$
\int u\,dv=uv-\int v\,du,\qquad\text{即}\qquad \int u(x)v'(x)\,dx=u(x)v(x)-\int u'(x)v(x)\,dx
$$

**证.** 由乘积法则 $d(uv)=u\,dv+v\,du$，两边积分：

$$
uv=\int u\,dv+\int v\,du
$$

移项即得。

**理解（选谁当 $u$）.** 经验口诀"**反对幂指三**"：反三角、对数、幂函数、指数、三角，排在前面的优先当 $u$，因为它求导后会变简单。常见类型：

- $\int x^n e^{ax}dx,\ \int x^n\sin ax\,dx$：$u=x^n$，做 $n$ 次
- $\int x^n\ln x\,dx,\ \int x^n\arcsin x\,dx$：$u=\ln x$ 或反三角，$dv=x^n dx$
- $\int e^{ax}\sin bx\,dx$：两次分部后"解方程"回到自身

**例（出现自身时解方程）.**

$$
I=\int e^{ax}\sin bx\,dx
$$

两次分部得

$$
I=\frac{e^{ax}}{a^2+b^2}\left(a\sin bx-b\cos bx\right)+C
$$

**推导.** 第一次 $u=\sin bx$、$dv=e^{ax}dx$：

$$
I=\frac{1}{a}e^{ax}\sin bx-\frac{b}{a}\int e^{ax}\cos bx\,dx
$$

第二次对 $\int e^{ax}\cos bx\,dx$ 分部，得到 $I$ 的表达式，移项解出 $I$ 即可。

### 4.5 有理函数的积分

任何真分式 $\frac{P(x)}{Q(x)}$（分子次数小于分母）都能拆成三类部分分式之和：

$$
\frac{A}{x-a},\qquad \frac{A}{(x-a)^k},\qquad \frac{Bx+C}{x^2+px+q}\ \ (p^2-4q<0)
$$

分母先因式分解成一次与二次不可约因式的乘积，再设待定系数、通分比较系数（或代特殊值）求出。

**例（$\int\frac{dx}{x^2-a^2}$ 用部分分式）.**

$$
\frac{1}{x^2-a^2}=\frac{1}{2a}\left(\frac{1}{x-a}-\frac{1}{x+a}\right)
$$

所以

$$
\int\frac{dx}{x^2-a^2}=\frac{1}{2a}\left(\ln|x-a|-\ln|x+a|\right)+C=\frac{1}{2a}\ln\left|\frac{x-a}{x+a}\right|+C
$$

**例（假分式先除）.** $\frac{x^3}{x^2+1}=x-\frac{x}{x^2+1}$，于是

$$
\int\frac{x^3}{x^2+1}dx=\frac{x^2}{2}-\frac{1}{2}\ln(x^2+1)+C
$$

**推导（$\int\frac{Bx+C}{x^2+px+q}dx$ 的通法）.** 先把分子凑成分母导数的一半：设 $u=x^2+px+q$，$u'=2x+p$，把 $Bx+C$ 写成 $\frac{B}{2}(2x+p)+\left(C-\frac{Bp}{2}\right)$。前一项给出 $\frac{B}{2}\ln|u|$；后一项配方 $u=\left(x+\frac{p}{2}\right)^2+\left(q-\frac{p^2}{4}\right)$，用 $\arctan$ 公式。

### 4.6 三角有理式与简单无理式

#### 4.6.1 万能代换

$R(\sin x,\cos x)$ 是有理式时，令 $t=\tan\frac{x}{2}$，则

$$
\sin x=\frac{2t}{1+t^2},\qquad \cos x=\frac{1-t^2}{1+t^2},\qquad dx=\frac{2\,dt}{1+t^2}
$$

**推导.** 前两个就是第 1 章的万能公式；$dx$ 由 $x=2\arctan t$ 求导得到。代换后变成 $t$ 的有理式，一定能积出来，但计算量常常很大，优先考虑更简单的凑法。

#### 4.6.2 常用三角有理式技巧

- 含 $\sin^2x,\cos^2x$：用倍角降次 $\sin^2x=\frac{1-\cos 2x}{2}$、$\cos^2x=\frac{1+\cos 2x}{2}$
- 含 $\sin^mx\cos^nx$：$m,n$ 一奇一偶时拆出奇次幂凑 $d\sin x$ 或 $d\cos x$；都偶时降次
- 含 $\tan x$：令 $u=\tan x$，$dx=\frac{du}{1+u^2}$
- $\int\frac{dx}{a\sin x+b\cos x}$：辅助角公式化成 $\frac{1}{\sqrt{a^2+b^2}}\int\frac{du}{\sin(x+\varphi)}$，再用 $\int\csc u\,du$

#### 4.6.3 简单无理式

含 $\sqrt[n]{ax+b}$ 时令 $t=\sqrt[n]{ax+b}$，反解 $x$ 化成有理式。含 $\sqrt{\frac{ax+b}{cx+d}}$ 时令 $t$ 等于整个根式。含 $\sqrt{a^2-x^2}$、$\sqrt{a^2+x^2}$、$\sqrt{x^2-a^2}$ 时用三角代换（4.3.2）。

**例.** $\int\frac{dx}{1+\sqrt{x}}$，令 $t=\sqrt{x}$，$x=t^2$，$dx=2t\,dt$：

$$
\int\frac{2t\,dt}{1+t}=2\int\left(1-\frac{1}{1+t}\right)dt=2\left(t-\ln|1+t|\right)+C=2\sqrt{x}-2\ln\left(1+\sqrt{x}\right)+C
$$

### 4.7 递推公式

分部积分能把高次幂的积分降到低次幂，得到递推公式。例如

$$
I_n=\int\sin^n x\,dx=-\frac{1}{n}\sin^{n-1}x\cos x+\frac{n-1}{n}I_{n-2}\ \ (n\ge 2)
$$

**推导.** $I_n=\int\sin^{n-1}x\cdot\sin x\,dx$，令 $u=\sin^{n-1}x$、$dv=\sin x\,dx$：

$$
I_n=-\sin^{n-1}x\cos x+(n-1)\int\sin^{n-2}x\cos^2 x\,dx
$$

再用 $\cos^2x=1-\sin^2x$，得 $I_n=-\sin^{n-1}x\cos x+(n-1)\left(I_{n-2}-I_n\right)$，移项解出 $I_n$。

类似地有

$$
\int\sec^n x\,dx=\frac{\sec^{n-2}x\tan x}{n-1}+\frac{n-2}{n-1}\int\sec^{n-2}x\,dx
$$

**理解.** 递推公式的作用是把 $\int\sin^n$、$\int\sec^n$、$\int\frac{dx}{(x^2+a^2)^n}$ 这类降阶，配合定积分还能得到华里士公式（第 5 章）。

## 5. 定积分

不定积分给的是"一族函数"，定积分给的是"一个数"。把两者连起来的是牛顿-莱布尼茨公式，它让"加无数个小块"变成了"求原函数再代端点"。

### 5.1 定积分的定义

把 $[a,b]$ 分成 $n$ 个小区间，分点 $a=x_0<x_1<\cdots<x_n=b$，在每个小区间上任取 $\xi_i\in[x_{i-1},x_i]$，作和

$$
S_n=\sum_{i=1}^{n}f(\xi_i)\Delta x_i,\qquad \Delta x_i=x_i-x_{i-1}
$$

令 $\lambda=\max\Delta x_i$。若 $\lambda\to 0$ 时 $S_n$ 的极限存在且与分法和 $\xi_i$ 的取法无关，就称 $f$ 在 $[a,b]$ 上可积，并记

$$
\int_a^b f(x)\,dx=\lim_{\lambda\to 0}\sum_{i=1}^{n}f(\xi_i)\Delta x_i
$$

**几何意义.** 曲边梯形的面积（$f\ge 0$ 时）；$f$ 有正有负时是"代数面积"，$x$ 轴上方为正、下方为负。

**可积的条件.** 可积的必要条件是 $f$ 在 $[a,b]$ 上有界。充分条件：$f$ 在 $[a,b]$ 上连续，或 $f$ 在 $[a,b]$ 上有界且只有有限个间断点，或 $f$ 单调有界。

**理解.** 定积分只和"被积函数 + 区间"有关，和积分变量用什么字母无关：$\int_a^b f(x)dx=\int_a^b f(t)dt$。

### 5.2 定积分的性质

设 $f,g$ 在 $[a,b]$ 上可积：

$$
\int_a^b\left[\alpha f(x)+\beta g(x)\right]dx=\alpha\int_a^b f(x)\,dx+\beta\int_a^b g(x)\,dx
$$

$$
\int_a^b f(x)\,dx=\int_a^c f(x)\,dx+\int_c^b f(x)\,dx
$$

$$
\int_a^a f(x)\,dx=0,\qquad \int_a^b f(x)\,dx=-\int_b^a f(x)\,dx
$$

$$
f(x)\le g(x)\ \Rightarrow\ \int_a^b f(x)\,dx\le\int_a^b g(x)\,dx
$$

$$
\left|\int_a^b f(x)\,dx\right|\le\int_a^b|f(x)|\,dx
$$

**估值定理.** 若 $m\le f(x)\le M$，则

$$
m(b-a)\le\int_a^b f(x)\,dx\le M(b-a)
$$

**积分中值定理.** 若 $f$ 在 $[a,b]$ 上连续，则存在 $\xi\in[a,b]$ 使

$$
\int_a^b f(x)\,dx=f(\xi)(b-a)
$$

**证（积分中值定理）.** 由最值定理，$f$ 在 $[a,b]$ 上取到最小值 $m$ 与最大值 $M$。由估值定理

$$
m\le\frac{1}{b-a}\int_a^b f(x)\,dx\le M
$$

由介值定理，$f$ 能取到 $m$ 与 $M$ 之间的一切值，所以存在 $\xi$ 使 $f(\xi)$ 等于中间那个数。

**理解.** $\frac{1}{b-a}\int_a^b f(x)dx$ 就是 $f$ 在 $[a,b]$ 上的**平均值**，积分中值定理说"平均值一定被某点取到"。

### 5.3 变限积分与牛顿-莱布尼茨公式

设 $f$ 在 $[a,b]$ 上连续，定义变上限积分

$$
\Phi(x)=\int_a^x f(t)\,dt
$$

则 $\Phi$ 在 $[a,b]$ 上可导且

$$
\Phi'(x)=f(x)
$$

**证.** 由定积分的区间可加性与积分中值定理，

$$
\frac{\Phi(x+h)-\Phi(x)}{h}=\frac{1}{h}\int_x^{x+h}f(t)\,dt=f(\xi)
$$

其中 $\xi$ 介于 $x$ 与 $x+h$ 之间。令 $h\to 0$，则 $\xi\to x$，由 $f$ 连续得 $f(\xi)\to f(x)$。

**牛顿-莱布尼茨公式.** 若 $f$ 在 $[a,b]$ 上连续，$F$ 是 $f$ 在该区间上的任一原函数，则

$$
\int_a^b f(x)\,dx=F(b)-F(a)
$$

**证.** 由上面 $\Phi'(x)=f(x)$，$\Phi$ 是 $f$ 的一个原函数，所以 $F(x)=\Phi(x)+C$。于是

$$
F(b)-F(a)=\Phi(b)-\Phi(a)=\int_a^b f(t)\,dt-0
$$

**理解.** 这个公式把定积分从"求和的极限"变成"原函数作差"，是整个积分学的中枢。

**复合变限积分求导.** 若 $\Phi(x)=\int_{\alpha(x)}^{\beta(x)}f(t)\,dt$，则

$$
\Phi'(x)=f\left(\beta(x)\right)\beta'(x)-f\left(\alpha(x)\right)\alpha'(x)
$$

**推导.** 设 $F$ 是 $f$ 的原函数，则 $\Phi(x)=\left[F(\beta(x))-F(\alpha(x))\right]$，直接用链式法则求导即可。

**易错点.** 被积函数里含 $x$ 时不能直接套这个公式，要先把 $x$ 弄出去。例如

$$
\int_0^x xf(t)\,dt=x\int_0^x f(t)\,dt
$$

**例.** 求 $\lim_{x\to 0}\frac{\int_0^x\sin t^2\,dt}{x^3}$。分子分母都趋于 $0$，用洛必达：

$$
\lim_{x\to 0}\frac{\sin x^2}{3x^2}=\frac{1}{3}
$$

### 5.4 定积分的换元法与分部积分

**换元法.** 设 $f$ 连续，$x=\varphi(t)$ 在 $[\alpha,\beta]$ 上单调且有连续导数，$\varphi(\alpha)=a$、$\varphi(\beta)=b$，则

$$
\int_a^b f(x)\,dx=\int_\alpha^\beta f\left(\varphi(t)\right)\varphi'(t)\,dt
$$

**易错点.** 定积分换元**一定要换上下限**，而且换完不必再换回 $x$，直接算新变量的定积分。

**例.** $\int_0^1\sqrt{1-x^2}\,dx$，令 $x=\sin t$，$t$ 从 $0$ 到 $\frac{\pi}{2}$：

$$
\int_0^{\frac{\pi}{2}}\cos^2 t\,dt=\frac{\pi}{4}
$$

这正是四分之一单位圆的面积。

**分部积分.** 由不定积分的公式加下限：

$$
\int_a^b u\,dv=\left[uv\right]_a^b-\int_a^b v\,du
$$

**对称性技巧**（特别省时间）：

- $f$ 为奇函数：$\int_{-a}^{a}f(x)\,dx=0$
- $f$ 为偶函数：$\int_{-a}^{a}f(x)\,dx=2\int_0^a f(x)\,dx$
- 周期为 $T$：$\int_a^{a+T}f(x)\,dx=\int_0^T f(x)\,dx$
- $\int_0^{\pi}xf(\sin x)\,dx=\frac{\pi}{2}\int_0^{\pi}f(\sin x)\,dx$

**证（最后一条）.** 令 $x=\pi-t$：

$$
\int_0^{\pi}xf(\sin x)\,dx=\int_0^{\pi}(\pi-t)f(\sin t)\,dt=\pi\int_0^{\pi}f(\sin x)\,dx-\int_0^{\pi}xf(\sin x)\,dx
$$

移项即得。

**华里士公式（点火公式）.**

$$
\int_0^{\frac{\pi}{2}}\sin^n x\,dx=\int_0^{\frac{\pi}{2}}\cos^n x\,dx=\begin{cases}\dfrac{(n-1)!!}{n!!}\cdot\dfrac{\pi}{2},& n\ \text{为偶数}\\[2mm]\dfrac{(n-1)!!}{n!!},& n\ \text{为奇数}\end{cases}
$$

其中 $!!$ 表示隔项相乘，约定 $0!!=1$。**推导**：从第 4 章的递推公式 $I_n=\frac{n-1}{n}I_{n-2}$ 出发，反复降到 $I_0=\frac{\pi}{2}$（偶）或 $I_1=1$（奇）。

### 5.5 反常积分

**无穷限反常积分.**

$$
\int_a^{+\infty}f(x)\,dx=\lim_{b\to+\infty}\int_a^b f(x)\,dx
$$

极限存在称收敛，否则发散。同理有 $(-\infty,b]$ 与 $(-\infty,+\infty)$ 的情形，后者要求两侧分别收敛。

**无界函数反常积分.** 若 $f$ 在 $a$ 的右邻域内无界，定义

$$
\int_a^b f(x)\,dx=\lim_{\varepsilon\to 0^+}\int_{a+\varepsilon}^b f(x)\,dx
$$

奇点在内点时按奇点拆成两段分别判断。

**$p$-积分的收敛性**（要记结论，也要会推）：

$$
\int_1^{+\infty}\frac{dx}{x^p}\ \text{当且仅当}\ p>1\ \text{收敛}
$$

$$
\int_0^{1}\frac{dx}{x^p}\ \text{当且仅当}\ p<1\ \text{收敛}
$$

**推导（第一个）.** $p\neq 1$ 时

$$
\int_1^b\frac{dx}{x^p}=\frac{1}{1-p}\left(b^{1-p}-1\right)
$$

$b\to+\infty$ 时 $b^{1-p}$ 收敛于 $0$ 需要 $1-p<0$，即 $p>1$；$p=1$ 时积分为 $\ln b\to+\infty$，发散。第二个同理，把区间换成 $(0,1]$，结果是 $\frac{1}{1-p}\left(1-\varepsilon^{1-p}\right)$，需要 $p<1$。

**常用结论.**

$$
\int_0^{+\infty}e^{-x}\,dx=1,\qquad \int_1^{+\infty}\frac{dx}{x(\ln x)^p}\ \text{当且仅当}\ p>1\ \text{收敛}
$$

定积分的几何与物理应用（面积、体积、弧长、功与压力）放到第 6 章单独整理，因为它们的难点在建模而不在计算。

## 6. 定积分的应用

这一章的公式不多，但每个都由"切一片微元、积分累加"得到。真正要练的是**把图形翻译成积分**：选哪个变量、微元长什么样、上下限是多少。

### 6.1 元素法（微元法）

用定积分求量 $U$ 的四个步骤：

1. 选积分变量 $x$ 及其变化区间 $[a,b]$；
2. 在小区间 $[x,x+dx]$ 上取微元 $dU$，要求 $dU$ 与 $\Delta U$ 只差一个比 $dx$ 高阶的无穷小；
3. 把 $dU$ 写成 $f(x)dx$；
4. 求定积分 $U=\int_a^b f(x)\,dx$。

**理解.** 关键是"微元要选得对"：$dU$ 必须是量 $U$ 本身的增量形式，而不是随便乘个 $dx$。面积、体积、弧长、功、压力都是这样得到的。

### 6.2 平面图形的面积

**直角坐标（上下曲线）.** 若 $f(x)\ge g(x)$ 在 $[a,b]$ 上，

$$
A=\int_a^b\left[f(x)-g(x)\right]dx
$$

**直角坐标（左右曲线）.** 若 $\psi(y)\ge\varphi(y)$ 在 $[c,d]$ 上，

$$
A=\int_c^d\left[\psi(y)-\varphi(y)\right]dy
$$

**推导.** 在 $[x,x+dx]$ 上取高为 $f(x)-g(x)$、宽为 $dx$ 的窄条，面积微元 $dA=\left[f(x)-g(x)\right]dx$，积分即得。

**极坐标.** 曲线 $r=r(\theta)$ 与射线 $\theta=\alpha$、$\theta=\beta$ 围成的扇形区域面积

$$
A=\frac{1}{2}\int_\alpha^\beta\left[r(\theta)\right]^2d\theta
$$

**推导.** 在 $[\theta,\theta+d\theta]$ 上取角度微元，这一小块近似成半径为 $r(\theta)$、圆心角为 $d\theta$ 的扇形，面积

$$
dA=\frac{1}{2}r^2\,d\theta
$$

积分即得。

**例（心形线）.** $r=a(1+\cos\theta)$（$0\le\theta\le 2\pi$）围成的面积：

$$
A=\frac{1}{2}\int_0^{2\pi}a^2(1+\cos\theta)^2d\theta=\frac{a^2}{2}\int_0^{2\pi}\left(1+2\cos\theta+\cos^2\theta\right)d\theta=\frac{3\pi a^2}{2}
$$

其中用了 $\int_0^{2\pi}\cos\theta\,d\theta=0$、$\int_0^{2\pi}\cos^2\theta\,d\theta=\pi$。

**参数方程.** 若 $x=\varphi(t),y=\psi(t)$（$\alpha\le t\le\beta$），曲线与 $x$ 轴及两端竖线围成的面积

$$
A=\int_\alpha^\beta\psi(t)\varphi'(t)\,dt
$$

（$y$ 全在 $x$ 轴上方取正；否则要加绝对值或分段。）

### 6.3 体积

#### 6.3.1 旋转体体积

**绕 $x$ 轴（圆盘法）.**

$$
V=\pi\int_a^b\left[f(x)\right]^2dx
$$

**绕 $x$ 轴（两曲线之间的环）.** 若 $f(x)\ge g(x)\ge 0$，

$$
V=\pi\int_a^b\left\{\left[f(x)\right]^2-\left[g(x)\right]^2\right\}dx
$$

**绕 $y$ 轴（柱壳法）.**

$$
V=2\pi\int_a^b x\,f(x)\,dx\qquad (0\le a\le x\le b,\ f(x)\ge 0)
$$

**推导（圆盘法与柱壳法）.** 圆盘法：在 $[x,x+dx]$ 上取薄片，旋转得到半径 $f(x)$、高 $dx$ 的薄圆盘，体积 $dV=\pi f^2(x)dx$。柱壳法：同一薄片绕 $y$ 轴转一周，扫出半径 $x$、高 $f(x)$、厚 $dx$ 的薄柱壳，把柱壳展开成薄板，体积约 $2\pi x\cdot f(x)\,dx$。

**例（$y=x^2$ 绕 $y$ 轴，$0\le x\le 1$）.**

$$
V=2\pi\int_0^1 x\cdot x^2\,dx=\frac{\pi}{2}
$$

用圆盘法验证：$x=\sqrt{y}$，$V=\pi\int_0^1\left(\sqrt{y}\right)^2dy=\frac{\pi}{2}$，两种方法一致。

#### 6.3.2 已知平行截面面积的立体

若垂直于 $x$ 轴的截面面积 $A(x)$ 已知，则

$$
V=\int_a^b A(x)\,dx
$$

**推导.** 在 $[x,x+dx]$ 上把立体近似成底面积 $A(x)$、高 $dx$ 的柱体，$dV=A(x)dx$。

**例.** 一个底面半径 $R$、高 $h$ 的圆锥，用垂直于轴的截面（圆）算体积，得到 $V=\frac{1}{3}\pi R^2h$。更典型的是"底面为圆、截面为等边三角形"这类题，先写出 $A(x)$ 再积分。

### 6.4 弧长

**直角坐标.** 曲线 $y=f(x)$ 在 $[a,b]$ 上的弧长

$$
s=\int_a^b\sqrt{1+\left(f'(x)\right)^2}\,dx
$$

**参数方程.** $x=\varphi(t),y=\psi(t)$，$\alpha\le t\le\beta$：

$$
s=\int_\alpha^\beta\sqrt{\left(\varphi'(t)\right)^2+\left(\psi'(t)\right)^2}\,dt
$$

**极坐标.** $r=r(\theta)$，$\alpha\le\theta\le\beta$：

$$
s=\int_\alpha^\beta\sqrt{\left(r(\theta)\right)^2+\left(r'(\theta)\right)^2}\,d\theta
$$

**推导（三种形式其实是同一个 $ds$）.** 由勾股定理，弧微分

$$
ds=\sqrt{(dx)^2+(dy)^2}=\sqrt{1+(y')^2}\,dx
$$

对参数方程，$dx=\varphi'dt$、$dy=\psi'dt$，代入即得参数形式。对极坐标，$x=r\cos\theta$、$y=r\sin\theta$，由

$$
dx=(r'\cos\theta-r\sin\theta)d\theta,\qquad dy=(r'\sin\theta+r\cos\theta)d\theta
$$

平方相加，交叉项抵消，得

$$
ds=\sqrt{(r')^2+r^2}\,d\theta
$$

### 6.5 旋转曲面的面积

曲线 $y=f(x)\ge 0$（$a\le x\le b$）绕 $x$ 轴旋转所得曲面的面积

$$
S=2\pi\int_a^b f(x)\sqrt{1+\left(f'(x)\right)^2}\,dx=2\pi\int_a^b y\,ds
$$

**推导.** 在 $[x,x+dx]$ 上，曲线段长 $ds$，旋转后近似成一个**圆台**的侧面：上下半径 $\approx f(x)$，母线长 $ds$。圆台侧面积 $=\pi(r_1+r_2)l\approx 2\pi f(x)ds$，故 $dS=2\pi y\,ds$。

**易错点.** 旋转曲面面积只能用 $2\pi y\,ds$，**不能**写成 $2\pi y\,dx$；后者把斜着的母线当成水平段，会算小。弧长同理，不能直接用 $dx$ 代替 $ds$。

### 6.6 物理应用

**变力做功.** 力 $F(x)$ 沿 $x$ 轴从 $a$ 到 $b$ 做功

$$
W=\int_a^b F(x)\,dx
$$

**液体的压力.** 液面深度为 $x$ 处的水平窄条宽度 $w(x)$、高度 $dx$，压强 $p=\rho gx$，面积 $w(x)dx$，所以

$$
P=\rho g\int_a^b x\,w(x)\,dx
$$

**液体的静压力、抽水做功.** 抽水问题中，把深度 $x$ 处厚 $dx$ 的一层水提到池口，做的功 $dW=\rho g\,A(x)\,x\,dx$，其中 $A(x)$ 是该层水的面积。

**质心（平面薄片、均匀密度）.** 由 $x$ 轴与 $y=f(x)$、$x=a$、$x=b$ 围成的曲边梯形：

$$
\bar{x}=\frac{\int_a^b x f(x)\,dx}{\int_a^b f(x)\,dx},\qquad \bar{y}=\frac{\frac{1}{2}\int_a^b\left[f(x)\right]^2dx}{\int_a^b f(x)\,dx}
$$

**推导（$\bar{y}$）.** 窄条微元的质心在 $\left(x,\frac{f(x)}{2}\right)$，质量微元 $dm=f(x)dx$，所以

$$
\bar{y}=\frac{\int\frac{f(x)}{2}\cdot f(x)\,dx}{\int f(x)\,dx}
$$

$\bar x$ 同理，用 $x\cdot f(x)dx$。

**引力.** 细杆对质点的引力，把细杆切成质量微元 $dm=\rho\,dx$，每段对质点的引力 $dF=G\frac{m\,dm}{r^2}$，方向沿连线，再分解到坐标轴上积分。

### 6.7 平均值与均方根

连续函数 $f$ 在 $[a,b]$ 上的平均值

$$
\bar{f}=\frac{1}{b-a}\int_a^b f(x)\,dx
$$

均方根（有效值）

$$
f_{\mathrm{rms}}=\sqrt{\frac{1}{b-a}\int_a^b\left[f(x)\right]^2dx}
$$

**理解.** 交流电的"220V"就是电压的有效值（均方根），正弦波 $u=U_m\sin\omega t$ 的有效值是 $\frac{U_m}{\sqrt{2}}$。

**推导（正弦有效值）.** 一周期内

$$
\frac{1}{T}\int_0^TU_m^2\sin^2\omega t\,dt=U_m^2\cdot\frac{1}{2}=\frac{U_m^2}{2}
$$

开方得 $\frac{U_m}{\sqrt{2}}$。

### 6.8 建模套路小结

1. **画图**：把区域、曲线、旋转轴画清楚，标出交点。
2. **选变量**：直角坐标看"上下"还是"左右"更好写；圆、扇形、心形线优先极坐标；旋转轴是 $y$ 轴且写 $x=f(y)$ 麻烦时用柱壳法。
3. **写微元**：面积 $dA=h\,dx$，体积 $dV=A(x)dx$ 或 $\pi f^2dx$，弧长 $ds=\sqrt{dx^2+dy^2}$。
4. **定上下限**：解交点，注意对称性可以只算一半再乘 $2$。

**易错点.** 极坐标面积公式里是 $\frac{1}{2}r^2$，别忘了那个 $\frac{1}{2}$；求两曲线围成的面积要先求交点、判断哪条在上；旋转体绕 $y$ 轴时若用圆盘法，积分变量必须换成 $y$，且被积函数写成 $x(y)$。

## 7. 微分方程

微分方程是"含未知函数及其导数的方程"。解它的思路很统一：先判断类型，套对应方法，最后别忘了常数 $C$ 和初始条件。

### 7.1 基本概念

- **阶**：方程中出现的最高阶导数的阶数
- **通解**：含与阶数相同个数的独立任意常数的解
- **特解**：用初始条件定出常数后的解
- **初始条件**：如 $y(x_0)=y_0$、$y'(x_0)=y_0'$ 等
- **线性 / 非线性**：关于未知函数及其各阶导数是否一次
- **齐次 / 非齐次**（线性方程）：右端是否为零

**理解.** 一阶方程的通解含一个常数，几何上是一族曲线（积分曲线）；初始条件就是从这族曲线里挑一条。

### 7.2 可分离变量方程

形如

$$
\frac{dy}{dx}=f(x)g(y)
$$

当 $g(y)\neq 0$ 时，两边除以 $g(y)$、乘以 $dx$：

$$
\frac{dy}{g(y)}=f(x)\,dx
$$

两边积分得通解

$$
\int\frac{dy}{g(y)}=\int f(x)\,dx+C
$$

**推导.** 设 $G$ 是 $\frac{1}{g}$ 的原函数，$F$ 是 $f$ 的原函数。对 $\frac{dy}{g(y)}=f(x)dx$ 两边积分，左边由第一类换元法得 $G(y)$，所以 $G(y)=F(x)+C$。再对 $x$ 求导验证：$G'(y)y'=F'(x)$，即 $\frac{y'}{g(y)}=f(x)$，正是原方程。

**例.** $y'=xy$。分离得 $\frac{dy}{y}=x\,dx$，积分 $\ln|y|=\frac{x^2}{2}+C$，所以

$$
y=Ce^{\frac{x^2}{2}}
$$

**易错点.** 分离时要考虑 $g(y)=0$ 的解是否被丢掉。$y'=xy$ 中 $y\equiv 0$ 也是解，它已经包含在 $C=0$ 里；但 $y'=y^2$ 中 $y\equiv 0$ 是解，而通解 $y=-\frac{1}{x+C}$ 取不到它，要单独写。

### 7.3 齐次方程

形如

$$
\frac{dy}{dx}=\varphi\left(\frac{y}{x}\right)
$$

令 $u=\frac{y}{x}$，即 $y=ux$，则

$$
\frac{dy}{dx}=u+x\frac{du}{dx}
$$

代回得

$$
u+x\frac{du}{dx}=\varphi(u)\ \Longrightarrow\ x\frac{du}{dx}=\varphi(u)-u
$$

这是关于 $u$ 的可分离变量方程：

$$
\int\frac{du}{\varphi(u)-u}=\int\frac{dx}{x}+C=\ln|x|+C
$$

**例.** $y'=\frac{y}{x}+\tan\frac{y}{x}$。令 $u=\frac{y}{x}$：

$$
x\frac{du}{dx}=\tan u\ \Longrightarrow\ \int\cot u\,du=\int\frac{dx}{x}
$$

$$
\ln|\sin u|=\ln|x|+C\ \Longrightarrow\ \sin\frac{y}{x}=Cx
$$

**理解.** 判断齐次的办法：把 $x$ 换成 $tx$、$y$ 换成 $ty$（$t>0$），右端不变，就是齐次的。

### 7.4 一阶线性微分方程

标准形：

$$
\frac{dy}{dx}+P(x)y=Q(x)
$$

通解公式：

$$
y=e^{-\int P(x)dx}\left[\int Q(x)e^{\int P(x)dx}dx+C\right]
$$

**推导（积分因子法）.** 两边同乘 $e^{\int P\,dx}$，注意

$$
\left[ye^{\int P\,dx}\right]'=y'e^{\int P\,dx}+yP(x)e^{\int P\,dx}=e^{\int P\,dx}\left(y'+Py\right)
$$

所以左端恰好是一个乘积的导数：

$$
\left[ye^{\int P\,dx}\right]'=Q(x)e^{\int P\,dx}
$$

两边积分，再乘回 $e^{-\int P\,dx}$ 即得通解公式。

**推导（常数变易法）.** 先解齐次方程 $y'+Py=0$，得 $y=Ce^{-\int P\,dx}$。设非齐次解为 $y=C(x)e^{-\int P\,dx}$，代入原方程：

$$
C'(x)e^{-\int P\,dx}=Q(x)\ \Longrightarrow\ C(x)=\int Q(x)e^{\int P\,dx}dx+C
$$

结果与积分因子法一致。

**易错点.** 用公式前必须把方程化成**标准形**（$y'$ 的系数为 $1$）。例如 $xy'+2y=x^2$ 要先写成 $y'+\frac{2}{x}y=x$，此时 $P=\frac{2}{x}$、$Q=x$。

### 7.5 伯努利方程

$$
\frac{dy}{dx}+P(x)y=Q(x)y^n\qquad(n\neq 0,1)
$$

两边除以 $y^n$，令 $z=y^{1-n}$，则 $z'=(1-n)y^{-n}y'$，方程化为线性方程

$$
z'+(1-n)P(x)z=(1-n)Q(x)
$$

**推导.** 原方程两边乘 $(1-n)y^{-n}$：

$$
(1-n)y^{-n}y'+(1-n)P(x)y^{1-n}=(1-n)Q(x)
$$

左边第一项正是 $z'$，第二项是 $(1-n)Pz$，于是得到关于 $z$ 的一阶线性方程。

### 7.6 可降阶的高阶方程

**$y^{(n)}=f(x)$ 型.** 逐次积分 $n$ 次，每次添一个常数。

**$y''=f(x,y')$ 型（不显含 $y$）.** 令 $p=y'$，则 $y''=p'$，方程降为关于 $p$ 的一阶方程

$$
p'=f(x,p)
$$

解出 $p$ 后再积分一次得 $y$。

**$y''=f(y,y')$ 型（不显含 $x$）.** 令 $p=y'$，把 $p$ 看成 $y$ 的函数，则

$$
y''=\frac{dp}{dx}=\frac{dp}{dy}\cdot\frac{dy}{dx}=p\frac{dp}{dy}
$$

方程变成

$$
p\frac{dp}{dy}=f(y,p)
$$

**例.** $y''=2y$（不显含 $x$）。令 $p=y'$，$p\frac{dp}{dy}=2y$，积分 $p^2=2y^2+C_1$，再解 $y'=\pm\sqrt{2y^2+C_1}$（可分离）。

### 7.7 二阶常系数线性齐次方程

$$
y''+py'+qy=0\qquad(p,q\ \text{为常数})
$$

**特征方程**：

$$
r^2+pr+q=0
$$

**推导（特征方程怎么来的）.** 猜解的形状是 $y=e^{rx}$，代入方程：

$$
\left(r^2+pr+q\right)e^{rx}=0
$$

$e^{rx}\neq 0$，所以必须有 $r^2+pr+q=0$。

由判别式分三种情形：

**(1) 两个相异实根 $r_1\neq r_2$：**

$$
y=C_1e^{r_1x}+C_2e^{r_2x}
$$

**(2) 重根 $r_1=r_2=r$：**

$$
y=\left(C_1+C_2x\right)e^{rx}
$$

**(3) 共轭复根 $r=\alpha\pm\beta i$（$\beta\neq 0$）：**

$$
y=e^{\alpha x}\left(C_1\cos\beta x+C_2\sin\beta x\right)
$$

**推导（重根时为什么要乘 $x$）.** 已知一个解 $y_1=e^{rx}$。设另一个解为 $y_2=u(x)e^{rx}$，代入方程。由 $r^2+pr+q=0$ 且 $r=-\frac{p}{2}$，代入化简后 $u$ 满足

$$
u''=0
$$

所以 $u=C_1+C_2x$，即第二个解是 $xe^{rx}$。

**推导（复根情形）.** 特征方程的复根给出复值解 $e^{(\alpha+i\beta)x}=e^{\alpha x}\left(\cos\beta x+i\sin\beta x\right)$（欧拉公式）。取实部与虚部，就得到两个实值解 $e^{\alpha x}\cos\beta x$、$e^{\alpha x}\sin\beta x$。

**理解.** 三种情形对应"两个不同的衰减/增长模式"、"临界阻尼"、"振荡"；弹簧振子的三种运动状态就是这三条。

### 7.8 二阶常系数线性非齐次方程

$$
y''+py'+qy=f(x)
$$

通解结构：

$$
y=Y(x)+y^{*}(x)
$$

其中 $Y$ 是齐次方程的通解，$y^{*}$ 是非齐次方程的一个**特解**。

**待定系数法（$f(x)=P_m(x)e^{\lambda x}$ 型）.** 设

$$
y^{*}=x^{k}Q_m(x)e^{\lambda x}
$$

其中 $Q_m$ 是与 $P_m$ 同次的待定多项式，$k$ 的取法：

- $\lambda$ 不是特征根：$k=0$
- $\lambda$ 是特征方程的单根：$k=1$
- $\lambda$ 是特征方程的重根：$k=2$

**推导（$k$ 为什么这样取）.** 把 $y^{*}$ 代入左端，算子 $L=\frac{d^2}{dx^2}+p\frac{d}{dx}+q$ 作用在 $Q_m(x)e^{\lambda x}$ 上得到形如 $\tilde{Q}_m(x)e^{\lambda x}$ 的式子。若 $\lambda$ 是特征根，$e^{\lambda x}$ 这一因子会让常数项被"吃掉"，需要乘 $x$ 提次；$\lambda$ 是 $k$ 重根就乘 $x^k$。

**待定系数法（$f(x)=e^{\lambda x}\left[P_l(x)\cos\omega x+R_n(x)\sin\omega x\right]$ 型）.** 设

$$
y^{*}=x^{k}e^{\lambda x}\left[M_s(x)\cos\omega x+N_s(x)\sin\omega x\right],\qquad s=\max\{l,n\}
$$

其中 $k=0$ 若 $\lambda\pm i\omega$ 不是特征根，$k=1$ 若是特征根。

**叠加原理.** 若 $f=f_1+f_2$，$y_1^{*}$ 是 $f_1$ 对应的特解，$y_2^{*}$ 是 $f_2$ 对应的特解，则 $y_1^{*}+y_2^{*}$ 是 $f$ 的特解。

**例.** $y''+y=x$。特征根 $\pm i$，齐次通解 $Y=C_1\cos x+C_2\sin x$。$f=x$ 是 $P_1(x)e^{0x}$，$\lambda=0$ 不是特征根，设 $y^{*}=ax+b$，代入得 $a=1$、$b=0$，所以 $y^{*}=x$。通解

$$
y=C_1\cos x+C_2\sin x+x
$$

### 7.9 欧拉方程

$$
x^2y''+pxy'+qy=f(x)\qquad(x>0)
$$

令 $x=e^{t}$（即 $t=\ln x$），则

$$
xy'=\frac{dy}{dt},\qquad x^2y''=\frac{d^2y}{dt^2}-\frac{dy}{dt}
$$

**推导.** 由链式法则 $\frac{dy}{dx}=\frac{dy}{dt}\cdot\frac{dt}{dx}=\frac{1}{x}\frac{dy}{dt}$，所以 $xy'=\frac{dy}{dt}$。再求一次：

$$
y''=\frac{d}{dx}\left(\frac{1}{x}\frac{dy}{dt}\right)=-\frac{1}{x^2}\frac{dy}{dt}+\frac{1}{x^2}\frac{d^2y}{dt^2}
$$

两边乘 $x^2$ 即得。代换后变成常系数线性方程。

### 7.10 解题流程小结

1. **看阶数**：一阶的常见类型是可分离、齐次、线性、伯努利；二阶看是否常系数、是否线性、是否齐次。
2. **化成标准形**：一阶线性要把 $y'$ 系数化为 $1$；常系数方程要写特征方程。
3. **求通解**：该带几个常数就带几个。
4. **代初始条件**：先代 $y$，再代 $y'$，解方程组定常数。
5. **回代检验**：把解代回原方程看一眼，能拦住大部分计算错误。

**易错点.** 一阶线性公式里的两个积分**不能**乱约；$\int P\,dx$ 不再加常数（常数会被吸收进 $C$）；含 $y^n$ 的项不是线性方程，别硬套线性公式；非齐次特解设形式时，一定要先写出特征根，判断 $k$ 取 $0$、$1$ 还是 $2$。

## 8. 向量代数与空间解析几何

空间几何的公式几乎都能从两个东西推出来：**数量积管"角度和投影"，向量积管"垂直和面积"**。把这两个乘法的几何意义想清楚，平面、直线、切平面就都不难。

### 8.1 向量及其线性运算

向量 $\vec{a}=(a_x,a_y,a_z)$ 的模：

$$
|\vec{a}|=\sqrt{a_x^2+a_y^2+a_z^2}
$$

单位向量 $\vec{a}^{0}=\frac{\vec{a}}{|\vec{a}|}$。方向余弦：

$$
\cos\alpha=\frac{a_x}{|\vec{a}|},\qquad \cos\beta=\frac{a_y}{|\vec{a}|},\qquad \cos\gamma=\frac{a_z}{|\vec{a}|}
$$

**推导（方向余弦的平方和）.**

$$
\cos^2\alpha+\cos^2\beta+\cos^2\gamma=\frac{a_x^2+a_y^2+a_z^2}{|\vec{a}|^2}=1
$$

**线性运算.** 加减法按坐标分量进行；数乘 $\lambda\vec{a}=(\lambda a_x,\lambda a_y,\lambda a_z)$，$|\lambda\vec{a}|=|\lambda||\vec{a}|$，方向由 $\lambda$ 的符号决定。

**两点间距离与定比分点.** $A(x_1,y_1,z_1)$、$B(x_2,y_2,z_2)$：

$$
|AB|=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}
$$

若 $P$ 分 $\overrightarrow{AB}$ 之比为 $\lambda$（即 $\overrightarrow{AP}=\lambda\overrightarrow{PB}$），则

$$
P\left(\frac{x_1+\lambda x_2}{1+\lambda},\frac{y_1+\lambda y_2}{1+\lambda},\frac{z_1+\lambda z_2}{1+\lambda}\right)
$$

$\lambda=1$ 时就是中点公式。

### 8.2 数量积（点积、内积）

**定义.**

$$
\vec{a}\cdot\vec{b}=|\vec{a}||\vec{b}|\cos\theta
$$

其中 $\theta$ 是两向量的夹角。

**坐标公式.**

$$
\vec{a}\cdot\vec{b}=a_xb_x+a_yb_y+a_zb_z
$$

**推导（坐标公式）.** 先把向量按基底分解：$\vec{a}=a_x\vec{i}+a_y\vec{j}+a_z\vec{k}$，$\vec{b}$ 同理。数量积对加法满足分配律，而基向量的数量积为

$$
\vec{i}\cdot\vec{i}=\vec{j}\cdot\vec{j}=\vec{k}\cdot\vec{k}=1,\qquad \vec{i}\cdot\vec{j}=\vec{j}\cdot\vec{k}=\vec{k}\cdot\vec{i}=0
$$

展开后交叉项全为零，只剩

$$
\vec{a}\cdot\vec{b}=a_xb_x+a_yb_y+a_zb_z
$$

由此得到几个常用结论：

$$
\cos\theta=\frac{\vec{a}\cdot\vec{b}}{|\vec{a}||\vec{b}|}
$$

$$
\vec{a}\perp\vec{b}\iff\vec{a}\cdot\vec{b}=0\iff a_xb_x+a_yb_y+a_zb_z=0
$$

**投影.**

$$
\mathrm{Prj}_{\vec{b}}\vec{a}=|\vec{a}|\cos\theta=\frac{\vec{a}\cdot\vec{b}}{|\vec{b}|}
$$

**推导.** 由定义 $\vec{a}\cdot\vec{b}=|\vec{b}|\left(|\vec{a}|\cos\theta\right)=|\vec{b}|\,\mathrm{Prj}_{\vec{b}}\vec{a}$，移项即得。

**理解.** 数量积是"一个向量的长度 × 另一个向量在它方向上的投影"，所以它能算角度、判断垂直、算功 $W=\vec{F}\cdot\vec{s}$。

### 8.3 向量积（叉积、外积）

**定义.** $\vec{c}=\vec{a}\times\vec{b}$ 满足：

- $|\vec{c}|=|\vec{a}||\vec{b}|\sin\theta$
- $\vec{c}\perp\vec{a}$ 且 $\vec{c}\perp\vec{b}$
- $\vec{a},\vec{b},\vec{c}$ 成右手系

**坐标公式.**

$$
\vec{a}\times\vec{b}=\begin{vmatrix}\vec{i}&\vec{j}&\vec{k}\\ a_x&a_y&a_z\\ b_x&b_y&b_z\end{vmatrix}
$$

**推导（模 = 平行四边形面积）.** 把 $\vec{a},\vec{b}$ 平移到同一起点，它们张成的平行四边形面积是

$$
S=|\vec{a}||\vec{b}|\sin\theta=|\vec{a}\times\vec{b}|
$$

所以 $|\vec{a}\times\vec{b}|$ 就是平行四边形面积，三角形面积是它的一半：

$$
S_{\triangle}=\frac{1}{2}|\vec{a}\times\vec{b}|
$$

**推导（坐标公式）.** 利用叉积对加法的分配律和基向量的叉积

$$
\vec{i}\times\vec{j}=\vec{k},\quad \vec{j}\times\vec{k}=\vec{i},\quad \vec{k}\times\vec{i}=\vec{j}
$$

$$
\vec{i}\times\vec{i}=\vec{j}\times\vec{j}=\vec{k}\times\vec{k}=\vec{0},\qquad \vec{j}\times\vec{i}=-\vec{k},\ \dots
$$

展开十二项后整理，恰好等于上面那个行列式按第一行展开的结果。

**平行条件.**

$$
\vec{a}\parallel\vec{b}\iff\vec{a}\times\vec{b}=\vec{0}\iff\frac{a_x}{b_x}=\frac{a_y}{b_y}=\frac{a_z}{b_z}
$$

**混合积.**

$$
[\vec{a}\vec{b}\vec{c}]=(\vec{a}\times\vec{b})\cdot\vec{c}=\begin{vmatrix}a_x&a_y&a_z\\ b_x&b_y&b_z\\ c_x&c_y&c_z\end{vmatrix}
$$

**推导（混合积的体积意义）.** $|\vec{a}\times\vec{b}|$ 是底面积，$\vec{c}$ 在 $\vec{a}\times\vec{b}$ 方向上的投影就是高，所以

$$
V=\left|(\vec{a}\times\vec{b})\cdot\vec{c}\right|
$$

是平行六面体的体积。三向量共面 $\iff$ 体积为零 $\iff$ 行列式为零：

$$
\vec{a},\vec{b},\vec{c}\ \text{共面}\iff\begin{vmatrix}a_x&a_y&a_z\\ b_x&b_y&b_z\\ c_x&c_y&c_z\end{vmatrix}=0
$$

**易错点.** 向量积**不满足交换律**：$\vec{a}\times\vec{b}=-\vec{b}\times\vec{a}$；$\vec{a}\times\vec{a}=\vec{0}$；两个非零向量叉乘为零，说明它们平行，而不是"垂直"。

### 8.4 平面方程

**点法式.** 过点 $M_0(x_0,y_0,z_0)$、以 $\vec{n}=(A,B,C)$ 为法向量的平面：

$$
A(x-x_0)+B(y-y_0)+C(z-z_0)=0
$$

**推导.** 设 $M(x,y,z)$ 是平面上任一点，则 $\overrightarrow{M_0M}=(x-x_0,y-y_0,z-z_0)$ 与法向量垂直：

$$
\vec{n}\cdot\overrightarrow{M_0M}=0
$$

展开即得点法式。

**一般式.**

$$
Ax+By+Cz+D=0
$$

其中 $(A,B,C)$ 就是法向量。截距式（$A,B,C,D$ 均不为零且平面不过原点）：

$$
\frac{x}{a}+\frac{y}{b}+\frac{z}{c}=1
$$

**推导（截距式）.** 令 $y=z=0$ 得 $x$ 轴截距 $a=-\frac{D}{A}$，同理 $b=-\frac{D}{B}$、$c=-\frac{D}{C}$，代入一般式整理即得。

**点到平面的距离.**

$$
d=\frac{|Ax_0+By_0+Cz_0+D|}{\sqrt{A^2+B^2+C^2}}
$$

**推导.** 在平面上任取一点 $M_1$，距离等于 $\overrightarrow{M_1M_0}$ 在法向量上的投影的绝对值：

$$
d=\left|\mathrm{Prj}_{\vec{n}}\overrightarrow{M_1M_0}\right|=\frac{\left|\vec{n}\cdot\overrightarrow{M_0M_1}\right|}{|\vec{n}|}=\frac{|Ax_0+By_0+Cz_0+D|}{\sqrt{A^2+B^2+C^2}}
$$

最后一步用了 $M_1$ 在平面上，故 $Ax_1+By_1+Cz_1+D=0$，把差的常数项消掉。

**两平面的夹角.**

$$
\cos\theta=\frac{|A_1A_2+B_1B_2+C_1C_2|}{\sqrt{A_1^2+B_1^2+C_1^2}\sqrt{A_2^2+B_2^2+C_2^2}}
$$

两平面平行 $\iff$ 法向量平行；垂直 $\iff$ 法向量垂直。

### 8.5 空间直线方程

**点向式（对称式）.** 过 $M_0(x_0,y_0,z_0)$、方向向量 $\vec{s}=(m,n,p)$：

$$
\frac{x-x_0}{m}=\frac{y-y_0}{n}=\frac{z-z_0}{p}
$$

**参数式.**

$$
x=x_0+mt,\qquad y=y_0+nt,\qquad z=z_0+pt
$$

**推导.** $\overrightarrow{M_0M}\parallel\vec{s}$，所以存在 $t$ 使 $\overrightarrow{M_0M}=t\vec{s}$，即坐标形式。

**一般式（两平面交线）.**

$$
\begin{cases}A_1x+B_1y+C_1z+D_1=0\\ A_2x+B_2y+C_2z+D_2=0\end{cases}
$$

其方向向量可由两法向量叉乘得到：

$$
\vec{s}=\vec{n}_1\times\vec{n}_2
$$

**推导.** 交线同时垂直于两个法向量，因此方向向量是 $\vec{n}_1\times\vec{n}_2$；这也解释了"两平面不平行才有交线"。

**直线与平面的夹角.**

$$
\sin\theta=\frac{|Am+Bn+Cp|}{\sqrt{A^2+B^2+C^2}\sqrt{m^2+n^2+p^2}}
$$

**推导.** $\vec{s}$ 与 $\vec{n}$ 的夹角 $\varphi$ 满足 $\cos\varphi=\frac{\vec{s}\cdot\vec{n}}{|\vec{s}||\vec{n}|}$，而直线与平面的夹角 $\theta=\frac{\pi}{2}-\varphi$，所以 $\sin\theta=|\cos\varphi|$。

**点到直线的距离.**

$$
d=\frac{\left|\overrightarrow{M_0M_1}\times\vec{s}\right|}{|\vec{s}|}
$$

其中 $M_0$ 是直线上的点，$\vec{s}$ 是方向向量。**推导**：$\left|\overrightarrow{M_0M_1}\times\vec{s}\right|$ 是以 $\overrightarrow{M_0M_1}$ 和 $\vec{s}$ 为邻边的平行四边形面积，除以底 $|\vec{s}|$ 就是高，即点到直线的距离。

### 8.6 曲面与空间曲线

**球面.** 球心 $(x_0,y_0,z_0)$、半径 $R$：

$$
(x-x_0)^2+(y-y_0)^2+(z-z_0)^2=R^2
$$

**柱面.** $F(x,y)=0$ 表示母线平行于 $z$ 轴的柱面（方程里缺哪个变量，母线就平行于哪根轴）。

**旋转曲面.** $yOz$ 平面上的曲线 $F(y,z)=0$ 绕 $z$ 轴旋转，得到

$$
F\left(\pm\sqrt{x^2+y^2},z\right)=0
$$

**推导.** 旋转后，点与原曲线上的点 $(0,y_0,z_0)$ 满足 $z_0=z$，且到 $z$ 轴的距离相等：$\sqrt{x^2+y^2}=|y_0|$，所以把 $y_0=\pm\sqrt{x^2+y^2}$ 代回原曲线方程即得。

**二次曲面（标准形）.**

$$
\frac{x^2}{a^2}+\frac{y^2}{b^2}+\frac{z^2}{c^2}=1\ \ \text{椭球面}
$$

$$
\frac{x^2}{a^2}+\frac{y^2}{b^2}=z\ \ \text{椭圆抛物面}
$$

$$
\frac{x^2}{a^2}+\frac{y^2}{b^2}-\frac{z^2}{c^2}=1\ \ \text{单叶双曲面}
$$

$$
\frac{x^2}{a^2}+\frac{y^2}{b^2}-\frac{z^2}{c^2}=-1\ \ \text{双叶双曲面}
$$

$$
\frac{x^2}{a^2}+\frac{y^2}{b^2}=\frac{z^2}{c^2}\ \ \text{圆锥面}
$$

$$
x^2+y^2=R^2\ \ \text{圆柱面}
$$

**空间曲线.** 一般式是两个曲面方程联立；参数式

$$
x=x(t),\qquad y=y(t),\qquad z=z(t)
$$

曲线在 $xOy$ 面上的投影：从一般式中消去 $z$，得到 $H(x,y)=0$（柱面），再与 $z=0$ 联立。

曲面的切平面与法线、空间曲线的切线与法平面属于多元函数微分法的几何应用，完整推导放在第 9 章 §9.8，这里不再重复。

## 9. 多元函数微分法及其应用

### 9.1 平面点集与二元函数

一元函数的研究对象是区间，到了二元，研究对象换成了平面点集。点 $P_0(x_0,y_0)$ 的 $\delta$ 邻域是 $U(P_0,\delta)=\{(x,y)\mid (x-x_0)^2+(y-y_0)^2<\delta^2\}$，去掉中心就是去心邻域。若 $P_0$ 的某个邻域完全含于 $E$，就称 $P_0$ 为内点；若 $P_0$ 的任一邻域里既有 $E$ 的点又有 $E$ 外的点，叫边界点；若 $P_0$ 的任一去心邻域都含 $E$ 的点，叫聚点。注意聚点可以在 $E$ 外，边界点也可以在 $E$ 内。

**理解.** 若 $E$ 的每一点都是内点，$E$ 就叫开集；连通的开集叫开区域；开区域连同边界叫闭区域；存在 $M$ 使 $E$ 含于圆盘 $x^2+y^2<M^2$ 时 $E$ 有界。有界闭区域是我后面反复用到的条件，它相当于一元里的闭区间。

二元函数 $z=f(x,y)$ 的定义域 $D$ 是平面点集，几何意义是一张空间曲面，曲面在 $xy$ 平面上的投影就是 $D$。例如 $z=\sqrt{1-x^2-y^2}$ 的定义域是闭圆盘 $x^2+y^2\le 1$，图像是上半球面。

**易错点.** 二元函数的连续、可微都要在平面点集上讨论，不能像一元那样只盯左右两侧；后面很多反例都出在路径太多上。

### 9.2 二元函数的极限与连续

二重极限的定义是一元极限的翻版，只是靠近的方式变成平面上任意方向：

$$
\lim_{(x,y)\to(x_0,y_0)}f(x,y)=A
$$

指：$\forall \varepsilon>0$，$\exists \delta>0$，当 $0<\sqrt{(x-x_0)^2+(y-y_0)^2}<\delta$ 且 $(x,y)\in D$ 时，有 $|f(x,y)-A|<\varepsilon$。

**关键.** 极限存在，则沿任意路径趋近都得到同一个 $A$：路径 $(x(t),y(t))\to(x_0,y_0)$ 时 $f(x(t),y(t))$ 是复合极限，必趋于 $A$。所以证不存在只需找两条路径让极限不同；只算一条路径的值，只能知道若存在则等于多少，不能证存在。

反例一：$f(x,y)=\frac{xy}{x^2+y^2}$，$(x,y)\ne(0,0)$。沿 $y=kx$ 有 $f(x,kx)=\frac{k}{1+k^2}$，极限随 $k$ 变：$k=0$ 得 $0$，$k=1$ 得 $\frac12$，所以二重极限不存在。只沿两条坐标轴看会误以为极限是 $0$，这就是路径依赖的坑。

反例二：$f(x,y)=\frac{x^2y}{x^2+y^2}$，$(x,y)\ne(0,0)$。因为 $\frac{x^2}{x^2+y^2}\le 1$，所以 $|f(x,y)|\le |y|$，夹逼得极限为 $0$。这两个例子要成对记：分子是 $x^2y$ 能夹住，是 $xy$ 夹不住。

二重极限和累次极限不是一回事。$\lim_{x\to0}\lim_{y\to0}f(x,y)$ 是先对 $y$、再对 $x$ 取极限，只要求沿两条线分别有极限；二重极限要求所有路径统一。上面的 $f=\frac{xy}{x^2+y^2}$ 恰好两个累次极限都为 $0$，二重极限却不存在。反过来，二重极限存在时累次极限也未必存在，例如 $f=(x+y)\sin\frac1x\sin\frac1y$ 的二重极限为 $0$，但内层极限振荡。

连续就是 $\lim_{(x,y)\to(x_0,y_0)}f(x,y)=f(x_0,y_0)$，等价于 $\Delta z\to0$。$f=\frac{xy}{x^2+y^2}$ 在原点无论怎么补定义都不连续，是典型的间断点。

有界闭区域上的连续函数有三条好性质：一是有界且能取到最大值、最小值；二是介值定理，$m$ 与 $M$ 之间的每个值都能取到；三是一致连续，即 $\forall \varepsilon>0$，$\exists \delta>0$（只与 $\varepsilon$ 有关），只要 $|PQ|<\delta$，就有 $|f(P)-f(Q)|<\varepsilon$。前两条靠连续性与区域的紧性、连通性，第三条靠有限覆盖定理。

**易错点.** 连续只要求整体趋于同一点，不能只检查两条坐标轴；二重极限存在也不等于两个累次极限存在。

### 9.3 偏导数

偏导数就是把别的变量当常数。对 $x$ 的偏导数为

$$
f_x(x_0,y_0)=\lim_{\Delta x\to0}\frac{f(x_0+\Delta x,y_0)-f(x_0,y_0)}{\Delta x}
$$

也可写成 $f_x(x_0,y_0)=\lim_{x\to x_0}\frac{f(x,y_0)-f(x_0,y_0)}{x-x_0}$，对 $y$ 同理。

**几何意义.** 用平面 $y=y_0$ 截曲面 $z=f(x,y)$，得到曲线 $z=f(x,y_0)$；$f_x(x_0,y_0)$ 就是这条曲线在点 $M_0(x_0,y_0,f(x_0,y_0))$ 处切线的斜率。$f_y$ 则是用平面 $x=x_0$ 截出来的曲线斜率。

高阶偏导就是对偏导再求偏导。我记 $f_{xy}=(f_x)_y$，即先对 $x$ 后对 $y$。二阶混合偏导一般不能交换次序；若 $f_{xy}$ 与 $f_{yx}$ 在 $(x_0,y_0)$ 的某邻域内连续，则 $f_{xy}(x_0,y_0)=f_{yx}(x_0,y_0)$。

**证.** 令 $W=f(x_0+h,y_0+k)-f(x_0+h,y_0)-f(x_0,y_0+k)+f(x_0,y_0)$。先按行分组，令 $\varphi(x)=f(x,y_0+k)-f(x,y_0)$。由拉格朗日中值定理，$\xi$ 在 $x_0$ 与 $x_0+h$ 之间，且 $W=\varphi(x_0+h)-\varphi(x_0)=h\varphi'(\xi)=h[f_x(\xi,y_0+k)-f_x(\xi,y_0)]$；再对 $y$ 用拉格朗日中值定理（$\eta$ 在 $y_0$ 与 $y_0+k$ 之间）得 $W=hkf_{xy}(\xi,\eta)$。改按列分组同理得 $W=hkf_{yx}(\xi',\eta')$。于是 $f_{xy}(\xi,\eta)=f_{yx}(\xi',\eta')$，令 $h,k\to0$，由连续性即得结论。

**易错点.** 偏导数存在只保证沿两个坐标方向有切线，推不出连续：$f=\frac{xy}{x^2+y^2}$ 在原点补定义为 $0$ 后，$f_x(0,0)=f_y(0,0)=0$，但函数在原点不连续。

### 9.4 全微分

设 $z=f(x,y)$ 在 $(x_0,y_0)$ 附近有定义，增量为 $\Delta z=f(x_0+\Delta x,y_0+\Delta y)-f(x_0,y_0)$。若存在只与 $(x_0,y_0)$ 有关的 $A,B$，使

$$
\Delta z=A\Delta x+B\Delta y+o(\rho)
$$

其中 $\rho=\sqrt{(\Delta x)^2+(\Delta y)^2}$，则称 $f$ 在 $(x_0,y_0)$ 可微，$A\Delta x+B\Delta y$ 叫全微分，记作 $dz=A\,dx+B\,dy$（这里 $dx=\Delta x,dy=\Delta y$）。

**证（可微推连续）.** 由 $\Delta z=A\Delta x+B\Delta y+o(\rho)\to0$ 得 $\lim f(x_0+\Delta x,y_0+\Delta y)=f(x_0,y_0)$。

**证（可微推偏导存在，且 $A=f_x,B=f_y$）.** 取 $\Delta y=0$，则 $\Delta z=A\Delta x+o(|\Delta x|)$；除以 $\Delta x$ 再令 $\Delta x\to0$，得 $f_x(x_0,y_0)=A$。对 $y$ 同理得 $B=f_y$。所以全微分只能是 $dz=f_x dx+f_y dy$。

**证（偏导连续推可微）.** 设 $f_x,f_y$ 在 $(x_0,y_0)$ 的某邻域内连续。把增量拆成两段：

$$
\Delta z=[f(x_0+\Delta x,y_0+\Delta y)-f(x_0,y_0+\Delta y)]+[f(x_0,y_0+\Delta y)-f(x_0,y_0)]
$$

第一段固定 $y=y_0+\Delta y$ 对 $x$ 用拉格朗日中值定理，第二段固定 $x=x_0$ 对 $y$ 用拉格朗日中值定理，得

$$
\Delta z=f_x(x_0+\theta_1\Delta x,y_0+\Delta y)\Delta x+f_y(x_0,y_0+\theta_2\Delta y)\Delta y
$$

其中 $\theta_1,\theta_2\in(0,1)$。把 $f_x,f_y$ 在 $(x_0,y_0)$ 的值拆出来，余项记为 $R$，则 $R=[f_x(x_0+\theta_1\Delta x,y_0+\Delta y)-f_x(x_0,y_0)]\Delta x+[f_y(x_0,y_0+\theta_2\Delta y)-f_y(x_0,y_0)]\Delta y$。由偏导连续，$\rho\to0$ 时两个方括号都趋于 $0$，又 $|\Delta x|\le\rho$，$|\Delta y|\le\rho$，所以 $R=o(\rho)$。故 $f$ 可微。

**反例（偏导存在加连续仍不可微）.** 设

$$
f(x,y)=\begin{cases}\dfrac{xy}{\sqrt{x^2+y^2}},&(x,y)\ne(0,0)\\ 0,&(x,y)=(0,0)\end{cases}
$$

在原点 $f(x,0)=f(0,y)=0$，故 $f_x(0,0)=f_y(0,0)=0$；又 $|f|\le\frac12\sqrt{x^2+y^2}\to0$，$f$ 连续。若它可微，微分只能是 $0$，即要求 $\frac{xy}{\sqrt{x^2+y^2}}=o(\rho)$，也就是 $\frac{xy}{x^2+y^2}\to0$；但沿 $y=x$ 该比值为 $\frac12$，矛盾，所以不可微。

**易错点.** 可微比偏导存在强得多。偏导连续是可微的充分条件，不是必要条件；判断可微性时不能只验证 $f_x,f_y$ 存在。

### 9.5 复合函数求导与隐函数求导

先看全导数：$z=f(u,v)$，$u=u(t)$，$v=v(t)$，则 $\frac{dz}{dt}=f_u\frac{du}{dt}+f_v\frac{dv}{dt}$。因为 $u,v$ 都只由 $t$ 决定，路径只有一条，所以是对 $t$ 的全导数。

多元链式法则画树状图最好记：最上层 $z$，中间 $u,v$，底层 $x,y$；每条边乘相应的偏导，同一条从 $z$ 到 $x$ 的路径相加。设 $z=f(u,v)$，$u=u(x,y)$，$v=v(x,y)$，则

$$
\frac{\partial z}{\partial x}=\frac{\partial f}{\partial u}\frac{\partial u}{\partial x}+\frac{\partial f}{\partial v}\frac{\partial v}{\partial x}
$$

对 $y$ 完全对称：$\frac{\partial z}{\partial y}=\frac{\partial f}{\partial u}\frac{\partial u}{\partial y}+\frac{\partial f}{\partial v}\frac{\partial v}{\partial y}$。

**理解.** 一阶全微分形式不变性：不论 $u,v$ 是自变量还是中间变量，都有 $dz=f_u du+f_v dv$。把 $u,v$ 换成 $x,y$ 的函数代入，$du=u_x dx+u_y dy$、$dv=v_x dx+v_y dy$，合并后恰好是 $dz=z_x dx+z_y dy$，形式没变，所以叫不变性。

隐函数 $F(x,y)=0$ 确定 $y=y(x)$ 时，两边对 $x$ 求导：$F_x+F_y y'=0$，只要 $F_y\ne0$，就有 $y'=-\frac{F_x}{F_y}$。

**推导.** 这就是把 $F(x,y(x))$ 看成 $x$ 的复合函数，对 $x$ 求全导数并令其为 $0$；用全微分写也一样：$dF=F_x dx+F_y dy=0$，解出 $\frac{dy}{dx}=-\frac{F_x}{F_y}$。

同理，$F(x,y,z)=0$ 确定 $z=z(x,y)$ 时，对 $x$ 求偏导（把 $y$ 当常数）：$F_x+F_z z_x=0$，于是 $z_x=-\frac{F_x}{F_z}$。

对 $y$ 同理 $z_y=-\frac{F_y}{F_z}$。

**易错点.** 隐函数求导公式里的 $F_x,F_y,F_z$ 是在 $(x,y,z)$ 处取的偏导，分子分母别抄反；$F_z\ne0$ 是能解出 $z$ 的条件，做题时要先确认。

### 9.6 方向导数与梯度

方向导数问的是：从一点沿某个方向走，函数变化多快。设 $\vec{e}_l=(\cos\alpha,\cos\beta)$ 是单位向量，定义

$$
\left.\frac{\partial f}{\partial l}\right|_{(x_0,y_0)}=\lim_{t\to0^+}\frac{f(x_0+t\cos\alpha,y_0+t\cos\beta)-f(x_0,y_0)}{t}
$$

若 $f$ 可微，则 $\frac{\partial f}{\partial l}=f_x\cos\alpha+f_y\cos\beta=\nabla f\cdot\vec{e}_l$。因为沿方向的增量可以写成一阶全微分，高阶项除以 $t$ 后消失。

梯度就是偏导拼成的向量：$\nabla f=(f_x,f_y)$，三元时是 $(f_x,f_y,f_z)$。

**证（方向导数最大值）.** 由柯西–施瓦茨不等式，$\left|\frac{\partial f}{\partial l}\right|=|\nabla f\cdot\vec{e}_l|\le|\nabla f|\,|\vec{e}_l|=|\nabla f|$；当 $\nabla f\ne0$ 时，等号当且仅当 $\vec{e}_l$ 与 $\nabla f$ 同向。所以方向导数在梯度方向取最大值 $|\nabla f|$，在反方向取最小值 $-|\nabla f|$。梯度方向就是函数增长最快的方向，梯度模就是那个最大变化率。

**几何意义.** 等值线 $f(x,y)=C$ 的切向量 $(dx,dy)$ 满足 $df=f_x dx+f_y dy=0$，即 $\nabla f\cdot(dx,dy)=0$，所以梯度垂直于等值线，指向函数增大的方向。等值线越密，梯度越大。

**易错点.** 公式里的 $\cos\alpha,\cos\beta$ 必须来自单位向量，别把普通方向向量直接代进去；方向导数存在也不代表函数可微。

### 9.7 多元函数的极值

#### 9.7.1 无条件极值

**必要条件.** 若 $f$ 在区域内部的 $(x_0,y_0)$ 可微且取局部极值，则 $f_x(x_0,y_0)=f_y(x_0,y_0)=0$。证法是把 $y$ 固定成 $y_0$，一元函数 $g(x)=f(x,y_0)$ 在 $x_0$ 取极值，故 $g'(x_0)=f_x(x_0,y_0)=0$；对 $y$ 同理。

**充分条件.** 设 $f_x(x_0,y_0)=f_y(x_0,y_0)=0$，且 $A=f_{xx},B=f_{xy},C=f_{yy}$ 在 $(x_0,y_0)$ 的某邻域内连续。$AC-B^2>0$ 时是极值，$A>0$ 为极小，$A<0$ 为极大；$AC-B^2<0$ 时不是极值（鞍点）；$AC-B^2=0$ 时失效，要另想办法。

**推导思路（二元泰勒）.** 由二阶泰勒展开，

$$
f(x_0+h,y_0+k)-f(x_0,y_0)=\frac12(Ah^2+2Bhk+Ck^2)+o(h^2+k^2)
$$

极值由二次型 $Q=Ah^2+2Bhk+Ck^2$ 的符号决定。配方得 $Q=A\left(h+\frac{B}{A}k\right)^2+\frac{AC-B^2}{A}k^2$（$A\ne0$）。$AC-B^2>0$ 时 $Q$ 正定或负定，$\Delta f$ 的符号由 $Q$ 定死；$AC-B^2<0$ 时 $Q$ 不定，沿不同方向 $\Delta f$ 变号，所以不是极值；$=0$ 时二次型退化，要看更高阶项，例如 $x^4+y^4$ 在原点极小，而 $x^4-y^4$ 在原点不是极值。

#### 9.7.2 条件极值与拉格朗日乘数法

求 $f(x,y)$ 在约束 $g(x,y)=0$ 下的极值，构造拉格朗日函数 $L(x,y,\lambda)=f(x,y)+\lambda g(x,y)$。驻点满足

$$
\begin{cases}
f_x+\lambda g_x=0\\
f_y+\lambda g_y=0\\
g(x,y)=0
\end{cases}
$$

**推导.** 设约束在 $P_0$ 附近能解出 $y=y(x)$，且 $g_y\ne0$。条件极值点也是一元函数 $h(x)=f(x,y(x))$ 的极值点，所以 $h'(x_0)=f_x+f_y y'(x_0)=0$。又对 $g(x,y(x))=0$ 求导得 $g_x+g_y y'=0$，即 $y'=-\frac{g_x}{g_y}$。代入得 $f_x-\frac{f_y g_x}{g_y}=0$，即 $f_x g_y-f_y g_x=0$，也就是雅可比行列式 $\frac{\partial(f,g)}{\partial(x,y)}=0$，说明 $(f_x,f_y)$ 与 $(g_x,g_y)$ 平行。于是存在 $\lambda$ 使 $f_x=-\lambda g_x$，$f_y=-\lambda g_y$，这正是 $L_x=L_y=0$，再加上约束 $g=0$ 就是上面的方程组。

**易错点.** 拉格朗日乘数法只给必要条件，解出的驻点要代回比较；约束必须是等式，且 $\nabla g\ne0$。$g_y=0$ 时改解 $x=x(y)$，不要硬套 $y'$ 公式。

### 9.8 几何应用

#### 9.8.1 空间曲线的切线与法平面

设曲线由参数方程 $x=x(t),y=y(t),z=z(t)$ 给出，在 $t_0$ 处三个导数不全为零。割向量除以 $\Delta t$ 后令 $\Delta t\to0$，得到切向量 $\vec T=(x'(t_0),y'(t_0),z'(t_0))$。于是切线为

$$
\frac{x-x_0}{x'(t_0)}=\frac{y-y_0}{y'(t_0)}=\frac{z-z_0}{z'(t_0)}
$$

法平面是过点 $M_0$ 且以 $\vec T$ 为法向量的平面：$x'(t_0)(x-x_0)+y'(t_0)(y-y_0)+z'(t_0)(z-z_0)=0$。

**理解.** 切线方向就是位置向量对参数的变化率，和一元曲线 $y=f(x)$ 的斜率是一回事；法平面里的法是对曲线而言的。

#### 9.8.2 曲面的切平面与法线

设曲面由隐式方程 $F(x,y,z)=0$ 给出，$P_0(x_0,y_0,z_0)$ 在曲面上，且 $\nabla F(P_0)\ne0$。取曲面上过 $P_0$ 的任意曲线，其切向量为 $\vec T$；对 $F(x(t),y(t),z(t))=0$ 求导得 $F_x x'+F_y y'+F_z z'=0$，即 $\nabla F(P_0)\cdot\vec T=0$。所以 $\nabla F(P_0)$ 垂直于曲面上所有切向量，取作法向量。切平面为

$$
F_x(P_0)(x-x_0)+F_y(P_0)(y-y_0)+F_z(P_0)(z-z_0)=0
$$

法线为 $\frac{x-x_0}{F_x(P_0)}=\frac{y-y_0}{F_y(P_0)}=\frac{z-z_0}{F_z(P_0)}$，某个分母为 $0$ 时就把它理解成方向向量 $(F_x,F_y,F_z)$，不要硬写分式。

若曲面写成显式 $z=f(x,y)$，令 $F(x,y,z)=f(x,y)-z=0$，则 $\nabla F=(f_x,f_y,-1)$，切平面是 $z-z_0=f_x(x-x_0)+f_y(y-y_0)$。也可以从两条截线看：$y=y_0$ 的切线方向 $(1,0,f_x)$，$x=x_0$ 的切线方向 $(0,1,f_y)$，叉乘得法向量 $(-f_x,-f_y,1)$，同样得到上面的切平面。

**易错点.** 隐式曲面的法向量是三维梯度 $\nabla F=(F_x,F_y,F_z)$，别只写 $(F_x,F_y)$ 漏了 $F_z$；显式曲面 $z=f(x,y)$ 的法向量是 $(f_x,f_y,-1)$，别漏掉 $-1$。法线分母为 $0$ 时按方向向量处理。

## 10. 重积分

重积分把定积分从区间推广到平面区域和空间区域：把区域切成小块，用函数值乘小块的面积或体积，求和再取极限。

### 10.1 二重积分的概念与性质
#### 10.1.1 定义

设 $f(x,y)$ 在有界闭区域 $D$ 上有界。把 $D$ 任意分成 $n$ 个小区域，用 $\Delta\sigma_i$ 表示第 $i$ 块的面积，在第 $i$ 块上任取一点 $(\xi_i,\eta_i)$，作积分和 $\sum_{i=1}^{n}f(\xi_i,\eta_i)\,\Delta\sigma_i$。记 $\lambda$ 为所有小区域直径的最大值（一块区域的直径是它内部任意两点距离的上确界）。若 $\lambda\to 0$ 时积分和的极限存在，且与分割方式、取点方式都无关，就称此极限为 $f(x,y)$ 在 $D$ 上的二重积分：

$$
\iint_D f(x,y)\,d\sigma=\lim_{\lambda\to 0}\sum_{i=1}^{n}f(\xi_i,\eta_i)\,\Delta\sigma_i
$$

**理解.** 直角坐标下面积元 $d\sigma=dx\,dy$。一元积分累加的是"高 × 宽"，二重积分累加的是"高 × 底面积"，本质一次都没变。

**几何意义.** 当 $f(x,y)\ge 0$ 时，$\iint_D f\,d\sigma$ 就是以 $D$ 为底、以曲面 $z=f(x,y)$ 为顶的曲顶柱体的体积。每块底约 $\Delta\sigma_i$、高约 $f(\xi_i,\eta_i)$，柱体微元 $\Delta V_i\approx f(\xi_i,\eta_i)\Delta\sigma_i$，求和取极限即得。

#### 10.1.2 性质

设 $f,g$ 在 $D$ 上可积，$S$ 为 $D$ 的面积。

- 线性：$\iint_D(\alpha f+\beta g)\,d\sigma=\alpha\iint_D f\,d\sigma+\beta\iint_D g\,d\sigma$。
- 区域可加：把 $D$ 分成 $D_1,D_2$（除公共边界外不相交），则 $\iint_D f\,d\sigma=\iint_{D_1}f\,d\sigma+\iint_{D_2}f\,d\sigma$。
- 保序：若在 $D$ 上 $f\le g$，则 $\iint_D f\,d\sigma\le\iint_D g\,d\sigma$。
- 估值不等式：若 $m\le f(x,y)\le M$，则 $mS\le\iint_D f\,d\sigma\le MS$。
- 绝对值不等式：$\left|\iint_D f\,d\sigma\right|\le\iint_D|f|\,d\sigma$。

这五条合起来说明积分是"按面积加权平均再乘区域大小"：被积函数更大、区域更大，积分一定更大。

#### 10.1.3 积分中值定理

设 $f(x,y)$ 在有界闭区域 $D$ 上连续，$S$ 为 $D$ 的面积，则存在 $(\xi,\eta)\in D$，使

$$
\iint_D f(x,y)\,d\sigma=f(\xi,\eta)\,S
$$

**证.** $D$ 是有界闭区域、$f$ 连续，由最值定理，$f$ 在 $D$ 上取到最小值 $m$ 与最大值 $M$，即 $m\le f(x,y)\le M$ 对一切 $(x,y)\in D$ 成立。由估值不等式得 $mS\le\iint_D f\,d\sigma\le MS$，两边除以 $S>0$，得 $m\le\frac{1}{S}\iint_D f\,d\sigma\le M$。$D$ 连通、$f$ 连续，由介值定理，$f$ 能取到 $m$ 与 $M$ 之间的一切值，故存在 $(\xi,\eta)\in D$ 满足 $f(\xi,\eta)=\frac{1}{S}\iint_D f\,d\sigma$，两边乘 $S$ 即得结论。

**理解.** 右边 $f(\xi,\eta)S$ 是把曲顶柱体压成同体积平顶柱体后的高度，中值定理保证这个"平均高度"一定能在区域上某点取到。

### 10.2 直角坐标下的计算

二重积分的计算就是化成两次定积分，即累次积分。关键只有一句话：**先积的那一层，积分限可以含外层变量；后积的那一层，积分限必须是常数。**

#### 10.2.1 X 型区域与 Y 型区域

X 型区域用垂直于 $x$ 轴的直线去切，每条线都切出一段竖线段，即 $D=\{(x,y)\mid a\le x\le b,\ \varphi_1(x)\le y\le \varphi_2(x)\}$，于是

$$
\iint_D f(x,y)\,d\sigma=\int_a^b dx\int_{\varphi_1(x)}^{\varphi_2(x)} f(x,y)\,dy
$$

Y 型区域用水平直线去切，把 $x,y$ 的角色互换，即 $D=\{(x,y)\mid c\le y\le d,\ \psi_1(y)\le x\le \psi_2(y)\}$，同理得 $\iint_D f(x,y)\,d\sigma=\int_c^d dy\int_{\psi_1(y)}^{\psi_2(y)} f(x,y)\,dx$。

**理解.** 先对 $y$ 积的那一步是固定 $x$、算一条竖切片的面积 $A(x)=\int_{\varphi_1(x)}^{\varphi_2(x)}f(x,y)\,dy$。这时曲顶柱体被切成无数薄片，每片体积约 $dV=A(x)\,dx$，再沿 $x$ 累加。所以"先 $y$ 后 $x$"就是先算切片面积、再把切片叠起来。

**易错点.** 内层积完得到的是 $x$ 的函数，这一步还没算完，最后必须积成一个数；外层积分限只能是从边界读出的常数，不能含变量。

#### 10.2.2 交换积分次序

标准三步：画区域 → 用另一个方向重新描述边界 → 重写积分限。绝不能直接对调两个积分号。

例：把 $\int_0^1 dx\int_x^1 f(x,y)dy$ 改成先 $x$ 后 $y$。第一步读原式：$0\le x\le 1$，$x\le y\le 1$，区域是直线 $y=x$ 上方、由 $x=0$ 与 $y=1$ 围出的三角形，顶点为 $(0,0)$、$(0,1)$、$(1,1)$。第二步改看水平切片：固定 $y\in[0,1]$，$x$ 从 $0$ 到直线 $x=y$，于是

$$
\int_0^1 dy\int_0^y f(x,y)dx
$$

**易错点.** 边界 $y=x$ 换成 $x$ 的界时写成 $x=y$，上下限很容易颠倒；先画图再写，最稳。这里 $f$ 没有具体形式，换完次序只能停在这个形状。

### 10.3 极坐标下的计算

区域是圆、圆环、扇形，或被积函数是 $x^2+y^2$ 的形状时，极坐标能同时简化边界和被积函数。令 $x=r\cos\theta$，$y=r\sin\theta$。

#### 10.3.1 面积元的推导

取 $r$ 到 $r+\Delta r$、$\theta$ 到 $\theta+\Delta\theta$ 的一小块，它是圆心角 $\Delta\theta$、内外半径 $r$ 与 $r+\Delta r$ 的环扇形：

$$
\Delta\sigma=\frac{1}{2}\left[(r+\Delta r)^2-r^2\right]\Delta\theta=\left(r+\frac{\Delta r}{2}\right)\Delta r\,\Delta\theta
$$

当 $\Delta r\to 0$ 时括号里的 $\frac{\Delta r}{2}$ 可丢，得到面积元 $d\sigma=r\,dr\,d\theta$。代入二重积分即得

$$
\iint_D f(x,y)\,d\sigma=\iint_{D'} f(r\cos\theta,r\sin\theta)\,r\,dr\,d\theta
$$

**理解.** $r\,d\theta$ 是弧长，$dr$ 是径向宽度，两者相乘就是把环扇形近似成小矩形。这个 $r$ 正是 10.4 里雅可比的绝对值。

**易错点.** 漏乘 $r$ 是这一节最常见的错，$r$ 不是装饰，它是面积伸缩比，极点处伸缩比为 $0$。

#### 10.3.2 极坐标下的积分限

先画区域，再看能不能写成 $\alpha\le\theta\le\beta$、$r_1(\theta)\le r\le r_2(\theta)$。从极点引射线：射线扫过的角度范围是 $\theta$ 的界，射线与边界的两个交点给出 $r$ 的界，于是

$$
\int_\alpha^\beta d\theta\int_{r_1(\theta)}^{r_2(\theta)} f(r\cos\theta,r\sin\theta)\,r\,dr
$$

例如 $x^2+y^2\le a^2$ 是 $0\le\theta\le 2\pi$、$0\le r\le a$；圆 $x^2+y^2\le 2x$ 代入得 $r\le 2\cos\theta$，此时 $-\frac{\pi}{2}\le\theta\le\frac{\pi}{2}$。

#### 10.3.3 对称性

设 $D$ 关于 $x$ 轴对称。若 $f(x,-y)=-f(x,y)$，则积分为 $0$；若 $f(x,-y)=f(x,y)$，则 $D$ 上的积分等于上半部分积分的两倍。关于 $y$ 轴对称同理。

**理解.** 对称点 $(x,y)$ 与 $(x,-y)$ 的面积元相同，函数值反号，两两抵消；函数值为偶时上下两半相等，所以翻倍。

**轮换对称性.** 若 $D$ 关于直线 $y=x$ 对称，则互换 $x,y$ 区域不变，故 $\iint_D f(x,y)\,d\sigma=\iint_D f(y,x)\,d\sigma$。用它可把 $\iint_D x^2\,d\sigma$ 换成 $\iint_D y^2\,d\sigma$，两者都等于 $\frac{1}{2}\iint_D (x^2+y^2)\,d\sigma$。

### 10.4 二重积分的换元法

作代换 $x=x(u,v)$、$y=y(u,v)$，把 $uv$ 平面上的区域 $D'$ 一对一地映成 $xy$ 平面上的 $D$。雅可比行列式定义为

$$
\frac{\partial(x,y)}{\partial(u,v)}=\begin{vmatrix}\frac{\partial x}{\partial u}&\frac{\partial x}{\partial v}\\\frac{\partial y}{\partial u}&\frac{\partial y}{\partial v}\end{vmatrix}
$$

换元公式为

$$
\iint_D f(x,y)\,dx\,dy=\iint_{D'} f\big(x(u,v),y(u,v)\big)\left|\frac{\partial(x,y)}{\partial(u,v)}\right|du\,dv
$$

**理解.** 雅可比就是"面积伸缩比"。$uv$ 平面上边长 $du,dv$ 的小矩形，映过去近似成平行四边形，两条边向量是 $\vec{r}_u\,du$ 与 $\vec{r}_v\,dv$，其中 $\vec{r}_u=(\frac{\partial x}{\partial u},\frac{\partial y}{\partial u})$，$\vec{r}_v=(\frac{\partial x}{\partial v},\frac{\partial y}{\partial v})$。平行四边形面积等于 $|\vec{r}_u\times\vec{r}_v|\,du\,dv$，而叉积的模恰好是 $|J|$，所以 $dx\,dy=|J|\,du\,dv$。极坐标下 $J=r$，与 10.3 的环扇形推导一致。

**易错点.** 公式里是雅可比的**绝对值**，别丢；把 $\frac{\partial(x,y)}{\partial(u,v)}$ 写成 $\frac{\partial(u,v)}{\partial(x,y)}$ 时记得取倒数。换元要求一对一，边界也要跟着换，不能只换被积函数。

### 10.5 三重积分
#### 10.5.1 定义

$$
\iiint_\Omega f(x,y,z)\,dV=\lim_{\lambda\to 0}\sum_{i=1}^{n}f(\xi_i,\eta_i,\zeta_i)\,\Delta V_i
$$

结构与二重积分完全平行：把空间区域 $\Omega$ 分成小块，$\Delta V_i$ 是小块体积，$\lambda$ 是各块直径的最大值。

#### 10.5.2 直角坐标：投影法与截面法

投影法（先一后二）：把 $\Omega$ 投影到 $xy$ 平面得 $D_{xy}$，过 $(x,y)$ 作平行于 $z$ 轴的直线，穿入点为 $z=z_1(x,y)$、穿出点为 $z=z_2(x,y)$，则

$$
\iiint_\Omega f\,dV=\iint_{D_{xy}}dx\,dy\int_{z_1(x,y)}^{z_2(x,y)}f(x,y,z)\,dz
$$

截面法（先二后一）：用平面 $z$ 截 $\Omega$ 得截面 $D_z$，$z$ 的范围为 $[c,d]$，则

$$
\iiint_\Omega f\,dV=\int_c^d dz\iint_{D_z}f(x,y,z)\,dx\,dy
$$

选用规律：被积函数只含 $z$、或截面面积好算（球体、椭球、锥体）时用截面法；区域被上下两张曲面夹出时用投影法。

#### 10.5.3 柱坐标

柱坐标 $x=r\cos\theta$、$y=r\sin\theta$、$z=z$ 的雅可比为 $r$，所以体积元为

$$
dV=r\,dr\,d\theta\,dz
$$

**易错点.** 柱坐标与极坐标的面积元同源，都是那个 $r$；$z$ 方向不变，照抄 $r\,dr\,d\theta$ 再补 $dz$ 即可，别多乘。

#### 10.5.4 球坐标

球坐标中 $\rho\ge 0$ 是到原点的距离，$\varphi\in[0,\pi]$ 是与 $z$ 轴正向的夹角，$\theta\in[0,2\pi]$ 是绕 $z$ 轴的转角：$x=\rho\sin\varphi\cos\theta$，$y=\rho\sin\varphi\sin\theta$，$z=\rho\cos\varphi$。体积元为

$$
dV=\rho^2\sin\varphi\,d\rho\,d\varphi\,d\theta
$$

**证.** 取三个坐标面 $\rho,\rho+d\rho$，$\varphi,\varphi+d\varphi$，$\theta,\theta+d\theta$ 围成的小块，它近似为一个长方体，三条棱互相垂直，棱长分别是：沿 $\rho$ 方向为 $d\rho$；沿 $\varphi$ 方向是半径 $\rho$ 的圆弧转过 $d\varphi$，弧长为 $\rho\,d\varphi$；沿 $\theta$ 方向转的是纬圆，纬圆半径 $\rho\sin\varphi$，转过 $d\theta$ 得弧长 $\rho\sin\varphi\,d\theta$。三条棱长相乘即得 $dV=(d\rho)(\rho\,d\varphi)(\rho\sin\varphi\,d\theta)=\rho^2\sin\varphi\,d\rho\,d\varphi\,d\theta$。同一结果也能从雅可比行列式算出，其值为 $\rho^2\sin\varphi$。

**易错点.** $\varphi$ 是与 $z$ 轴的夹角，不是与 $xy$ 平面的夹角；$\sin\varphi$ 漏掉、或把 $\rho^2$ 写成 $\rho$，都是常见错。$\varphi$ 要扫满 $0$ 到 $\pi$，$\theta$ 要扫满 $2\pi$，只转半圈就会漏掉另一半。

#### 10.5.5 三重积分的换元法

$$
\iiint_\Omega f\,dV=\iiint_{\Omega'}f\big(x(u,v,w),y(u,v,w),z(u,v,w)\big)\left|\frac{\partial(x,y,z)}{\partial(u,v,w)}\right|du\,dv\,dw
$$

柱坐标、球坐标都是它的特例，雅可比分别等于 $r$ 与 $\rho^2\sin\varphi$。

### 10.6 重积分的应用
#### 10.6.1 体积与质量

空间区域 $\Omega$ 的体积就是密度取 $1$ 的质量，即 $V=\iiint_\Omega dV$；若 $\Omega$ 由 $z_1(x,y)\le z\le z_2(x,y)$ 夹出、投影为 $D$，则 $V=\iint_D[z_2(x,y)-z_1(x,y)]\,dx\,dy$。密度为 $\mu(x,y,z)$ 的物体，其质量为 $m=\iiint_\Omega \mu(x,y,z)\,dV$。

#### 10.6.2 质心

质心的 $x$ 坐标是静矩除以总质量：$\bar{x}=\frac{1}{m}\iiint_\Omega x\mu\,dV$，同理 $\bar{y}$、$\bar{z}$ 是把被积函数中的 $x$ 换成 $y$、$z$。平面薄片 $D$（面密度 $\mu$）对应地有 $m=\iint_D \mu\,d\sigma$ 与 $\bar{x}=\frac{1}{m}\iint_D x\mu\,d\sigma$。

**理解.** 分子是"对坐标平面的静矩"，分母是总质量，相除就是平均位置；均匀物体的质心就是形心，对称物体的质心必在对称面上。

#### 10.6.3 转动惯量

绕 $x$ 轴时，点到轴的距离平方是 $y^2+z^2$，所以 $I_x=\iiint_\Omega (y^2+z^2)\mu\,dV$；同理 $I_y=\iiint_\Omega (x^2+z^2)\mu\,dV$，$I_z=\iiint_\Omega (x^2+y^2)\mu\,dV$；绕原点 $I_O=\iiint_\Omega (x^2+y^2+z^2)\mu\,dV$。

**理解.** 记法是"缺哪个字母就是绕哪个轴"，因为绕 $x$ 轴转动时距离与 $x$ 无关；而 $I_O$ 用的是到原点的距离，三项全在。

**易错点.** $I_O=I_x+I_y+I_z$ 是错的，正确的是 $I_O=\frac{1}{2}(I_x+I_y+I_z)$，因为每个坐标平方在三条轴的式子里各出现两次。

#### 10.6.4 曲面面积

设曲面由 $z=z(x,y)$ 给出，在 $xy$ 平面上的投影区域为 $D$，$z$ 有连续偏导，则

$$
A=\iint_D\sqrt{1+z_x^2+z_y^2}\,dx\,dy
$$

**证.** 在 $D$ 里取边长 $dx,dy$ 的小矩形，映到曲面上是一小块曲面，用它在点 $(x,y,z(x,y))$ 处的切平面小块代替。曲面写成向量形式 $\vec{r}(x,y)=(x,y,z(x,y))$，两条切向量为 $\vec{r}_x=(1,0,z_x)$、$\vec{r}_y=(0,1,z_y)$，切平面小块是它们张成的平行四边形，面积为 $|\vec{r}_x\times\vec{r}_y|=\sqrt{(-z_x)^2+(-z_y)^2+1^2}=\sqrt{1+z_x^2+z_y^2}$。再乘 $dx\,dy$ 得曲面微元 $dA$，对 $D$ 积分即得公式。曲面越陡，$z_x,z_y$ 越大，同样大的投影小矩形对应的曲面小块越大，所以根号不小于 $1$，曲面面积不小于投影面积。第 11 章会用第一类曲面积分再讲一遍同一件事，那时 $dA$ 直接从曲面上量出来。

**易错点.** 根号不能丢，$dx\,dy$ 是投影面积而不是曲面面积，差的正是这个倾斜因子。

## 11. 曲线积分与曲面积分

前几章的积分都在平直的区域上做。这一章把积分对象换成曲线与曲面，套路仍是"分割、近似、求和、取极限"。两条主线：对弧长/对面积的积分没有方向，对坐标的积分有方向；最后用格林、高斯、斯托克斯三大公式，把边界上的积分和内部的积分连起来。

### 11.1 第一类曲线积分（对弧长）

#### 11.1.1 定义与性质

设 $L$ 可求长，$f(x,y)$ 在 $L$ 上有界。把 $L$ 分成 $n$ 个小弧段，第 $i$ 段弧长为 $\Delta s_i$，在其上任取一点 $(\xi_i,\eta_i)$，作和再取极限：

$$
\int_L f(x,y)\,ds=\lim_{\lambda\to0}\sum_{i=1}^{n}f(\xi_i,\eta_i)\Delta s_i
$$

**理解.** 其中 $\lambda=\max\{\Delta s_i\}$。若 $f$ 是线密度，这个积分就是曲线的质量；$\Delta s_i>0$ 没有符号，所以它与走向无关。性质：线性、可加、保号。

**易错点.** 化为定积分时下限必须小于上限，与起点、终点无关；被积函数里的 $x,y$ 要全部换成参数。

#### 11.1.2 计算：弧微分

设 $x=x(t)$，$y=y(t)$（$\alpha\le t\le\beta$），小弧段的弦长可以写成 $\sqrt{(\Delta x)^2+(\Delta y)^2}=\sqrt{\left(\frac{\Delta x}{\Delta t}\right)^2+\left(\frac{\Delta y}{\Delta t}\right)^2}\Delta t$。分割变细时，弧长与弦长之差是比 $\Delta t$ 高阶的小量，两个差商又分别趋于 $x'(t)$、$y'(t)$，所以

$$
ds=\sqrt{x'^2(t)+y'^2(t)}\,dt
$$

**证.** 弦长与弧长之比趋于 $1$，故求和时可用 $ds$ 代替 $\Delta s$。代入定义即得 $\int_L f(x,y)\,ds=\int_{\alpha}^{\beta}f(x(t),y(t))\sqrt{x'^2(t)+y'^2(t)}\,dt$（记住 $\alpha<\beta$）。

**理解.** 特例：$y=y(x)$ 时 $ds=\sqrt{1+y'^2}\,dx$；极坐标 $r=r(\theta)$ 时 $ds=\sqrt{r^2+r'^2}\,d\theta$；空间曲线 $ds=\sqrt{x'^2+y'^2+z'^2}\,dt$。记法：切向量长度乘以 $dt$。

### 11.2 第二类曲线积分（对坐标）

#### 11.2.1 定义与性质

把 $L$ 分成小段，第 $i$ 段的坐标增量记为 $\Delta x_i,\Delta y_i$：

$$
\int_L P\,dx+Q\,dy=\lim_{\lambda\to0}\sum_{i=1}^{n}\left[P(\xi_i,\eta_i)\Delta x_i+Q(\xi_i,\eta_i)\Delta y_i\right]
$$

**理解.** $\Delta x_i$ 有正负，所以积分值与方向有关；物理上是力 $\vec{F}=(P,Q)$ 沿 $L$ 做的功。性质：反向变号（$\int_{L^-}=-\int_L$）、线性、对路径可加。

#### 11.2.2 计算：参数化

起点对应 $t=\alpha$，终点对应 $t=\beta$，则 $dx=x'(t)dt$，$dy=y'(t)dt$：

$$
\int_L P\,dx+Q\,dy=\int_{\alpha}^{\beta}\left[P(x(t),y(t))x'(t)+Q(x(t),y(t))y'(t)\right]dt
$$

**易错点.** 下限对起点、上限对终点，不要求 $\alpha<\beta$；分段曲线必须分段算再相加，不能跨段套一个参数式。

#### 11.2.3 与第一类的关系

单位切向量为 $(\cos\alpha,\cos\beta)=\left(\frac{x'}{\sqrt{x'^2+y'^2}},\frac{y'}{\sqrt{x'^2+y'^2}}\right)$，而 $dx=\cos\alpha\,ds$，$dy=\cos\beta\,ds$，代入得

$$
\int_L P\,dx+Q\,dy=\int_L\left(P\cos\alpha+Q\cos\beta\right)ds
$$

**理解.** 右边"先投影再对弧长积分"，左边"对坐标积分"，是同一个量；向量形式为 $\int_L\vec{F}\cdot\vec{\tau}\,ds$，$\vec{\tau}$ 是单位切向量。方向余弦必须与 $L$ 的走向一致，反向时两个余弦同时变号。

### 11.3 格林公式

#### 11.3.1 公式与条件

设 $L$ 是分段光滑闭曲线，取正向（沿 $L$ 前进时 $D$ 在左侧），$P,Q$ 在 $D$ 上有一阶连续偏导：

$$
\oint_L P\,dx+Q\,dy=\iint_D\left(\frac{\partial Q}{\partial x}-\frac{\partial P}{\partial y}\right)dx dy
$$

**理解.** 格林公式是二维的牛顿–莱布尼茨公式：边界上的积分等于内部的偏导差。它把闭曲线积分换成二重积分，也常反过来用。

#### 11.3.2 证明

先设 $D$ 既是 $X$ 型又是 $Y$ 型：$D=\{(x,y)\mid a\le x\le b,\ y_1(x)\le y\le y_2(x)\}$。正向时下边界从左往右、上边界从右往左，两条竖边上 $dx=0$，再用牛顿–莱布尼茨公式把括号里的差化为对 $y$ 的积分：

$$
\oint_L P\,dx=\int_a^b P(x,y_1(x))\,dx-\int_a^b P(x,y_2(x))\,dx=-\int_a^b\left(\int_{y_1(x)}^{y_2(x)}\frac{\partial P}{\partial y}\,dy\right)dx=-\iint_D\frac{\partial P}{\partial y}\,dx dy
$$

**证.** 同理看成 $Y$ 型区域，右边界向上、左边界向下，上下两条边上 $dy=0$，于是 $\oint_L Q\,dy=\int_c^d\left[Q(x_2(y),y)-Q(x_1(y),y)\right]dy=\iint_D\frac{\partial Q}{\partial x}\,dx dy$。两式相加即得。一般区域用有限条辅助线分割成若干个这样的区域，内部公共边界方向相反、积分抵消。

**易错点.** 符号别记反：$dx$ 配 $-\partial P/\partial y$，$dy$ 配 $+\partial Q/\partial x$。取 $P=-y$，$Q=x$ 检验：$Q_x-P_y=2$，而 $\oint_L x\,dy-y\,dx=2A$。

#### 11.3.3 面积公式

取 $P=-\dfrac{y}{2}$，$Q=\dfrac{x}{2}$，则 $Q_x-P_y=1$，于是

$$
A=\iint_D1\,dx dy=\frac{1}{2}\oint_L\left(x\,dy-y\,dx\right)
$$

**理解.** 特例 $\oint_L x\,dy=-\oint_L y\,dx=A$。边界是椭圆、摆线时，拿参数方程直接算这个定积分，比二重积分省事。

#### 11.3.4 路径无关与全微分求原函数

设 $D$ 是单连通区域，$P,Q$ 在 $D$ 内有一阶连续偏导，则以下四条等价：

1. 对 $D$ 内任意分段光滑闭曲线 $L$，$\oint_L P\,dx+Q\,dy=0$；
2. 积分在 $D$ 内与路径无关，只与起点、终点有关；
3. 存在 $u(x,y)$，使 $du=P\,dx+Q\,dy$；
4. 在 $D$ 内处处 $\dfrac{\partial P}{\partial y}=\dfrac{\partial Q}{\partial x}$。

**证.** (1)$\Rightarrow$(2)：两条从 $A$ 到 $B$ 的路径拼成闭曲线，积分为 $0$。(2)$\Rightarrow$(3)：取 $u(x,y)=\int_{(x_0,y_0)}^{(x,y)}P\,dx+Q\,dy$，沿水平方向走一步，$u(x+\Delta x,y)-u(x,y)=\int_x^{x+\Delta x}P(t,y)\,dt$，由积分中值定理及连续性，$\frac{\partial u}{\partial x}=\lim\limits_{\Delta x\to0}\frac{1}{\Delta x}\int_x^{x+\Delta x}P(t,y)\,dt=P(x,y)$，同法 $u_y=Q$。(3)$\Rightarrow$(1)：闭曲线上 $\oint du=u(B)-u(A)=0$。(1)$\Rightarrow$(4)：若某点 $Q_x-P_y\ne0$，由连续性在含该点的小圆盘内同号，用格林公式得 $\oint\ne0$，矛盾。(4)$\Rightarrow$(1)：对 $L$ 围成的区域用格林公式，被积函数 $Q_x-P_y=0$。

**易错点.** "单连通"不能省。取 $P=-\dfrac{y}{x^2+y^2}$，$Q=\dfrac{x}{x^2+y^2}$，在挖去原点的区域上确有 $P_y=Q_x$，但沿单位圆积分为 $2\pi\ne0$——区域有洞，(4) 推不出 (1)。

**求原函数.** 沿折线 $(x_0,y_0)\to(x,y_0)\to(x,y)$ 积分，得 $u(x,y)=\int_{x_0}^{x}P(x,y_0)\,dx+\int_{y_0}^{y}Q(x,y)\,dy$。

**理解.** 第一段上 $y\equiv y_0$，第二段上 $x$ 取当前值。验算：$u_x=P(x,y_0)+\int_{y_0}^{y}P_y\,dy=P(x,y)$，$u_y=Q(x,y)$。

### 11.4 第一类曲面积分（对面积）

#### 11.4.1 定义与性质

把曲面 $\Sigma$ 分成 $n$ 小块，面积记为 $\Delta S_i$，取点 $(\xi_i,\eta_i,\zeta_i)$：

$$
\iint_\Sigma f(x,y,z)\,dS=\lim_{\lambda\to0}\sum_{i=1}^{n}f(\xi_i,\eta_i,\zeta_i)\Delta S_i
$$

**理解.** 若 $f$ 是面密度，积分就是曲面质量。$\Delta S_i>0$，故与选哪一侧无关（无向）。性质：线性、可加、保号。

#### 11.4.2 计算：面积元素

设 $\Sigma:z=z(x,y)$，投影区域为 $D_{xy}$。法向量取 $\vec{n}=(-z_x,-z_y,1)$，它与 $z$ 轴夹角 $\gamma$ 满足 $\cos\gamma=\dfrac{1}{\sqrt{1+z_x^2+z_y^2}}$。曲面小块 $\Delta S$ 用切平面小块近似，$\Delta\sigma=\Delta S\cos\gamma$，取极限即得

$$
\iint_\Sigma f\,dS=\iint_{D_{xy}}f(x,y,z(x,y))\sqrt{1+z_x^2+z_y^2}\,dx dy
$$

**理解.** $dS=\sqrt{1+z_x^2+z_y^2}\,dx dy$ 就是"切平面小块对投影面的放大系数"。

**易错点.** 投影须一一对应，有重叠要分片；被积函数里的 $z$ 必须换成 $z(x,y)$。

### 11.5 第二类曲面积分（对坐标）

#### 11.5.1 有向曲面与定义

指定法向量方向的一侧叫有向曲面。把投影带符号记为 $\Delta S_{i,yz}$ 等，则

$$
\iint_\Sigma P\,dy dz+Q\,dz dx+R\,dx dy=\lim_{\lambda\to0}\sum_{i=1}^{n}\left[P_i\Delta S_{i,yz}+Q_i\Delta S_{i,zx}+R_i\Delta S_{i,xy}\right]
$$

**理解.** 物理上是流量：$\vec{F}=(P,Q,R)$ 是流速场，积分是单位时间穿过 $\Sigma$ 指定一侧的流量；换一侧，三项全变号。性质：换侧变号、线性、可加。

#### 11.5.2 计算：投影定号

设 $\Sigma:z=z(x,y)$，法向量与 $z$ 轴夹角为 $\gamma$，则 $dx dy=\cos\gamma\,dS$，上侧取 $+$、下侧取 $-$，即 $\iint_\Sigma R\,dx dy=\pm\iint_{D_{xy}}R(x,y,z(x,y))\,dx dy$。

投影到 $yOz$ 面（$\Sigma:x=x(y,z)$）时 $\iint_\Sigma P\,dy dz=\pm\iint_{D_{yz}}P(x(y,z),y,z)\,dy dz$，前侧取 $+$、后侧取 $-$。

**易错点.** 符号不是死记"上正下负"，要看"法向量与对应坐标轴夹角余弦"的正负；每个积分只能投到与它微分对应的坐标面，$dy dz$ 必须投 $yOz$ 面。

#### 11.5.3 与第一类的关系

由 $dy dz=\cos\alpha\,dS$，$dz dx=\cos\beta\,dS$，$dx dy=\cos\gamma\,dS$ 得

$$
\iint_\Sigma P\,dy dz+Q\,dz dx+R\,dx dy=\iint_\Sigma\left(P\cos\alpha+Q\cos\beta+R\cos\gamma\right)dS
$$

**理解.** 这是"同一流量，两种记法"：左边按坐标面投影算，右边按面积乘方向余弦算。向量形式为 $\iint_\Sigma\vec{F}\cdot\vec{n}\,dS$。

### 11.6 高斯公式与斯托克斯公式

#### 11.6.1 高斯公式与散度

设 $\Omega$ 由分片光滑闭曲面 $\Sigma$ 围成，$\Sigma$ 取外侧，$P,Q,R$ 在 $\Omega$ 上有一阶连续偏导：

$$
\iiint_\Omega\left(\frac{\partial P}{\partial x}+\frac{\partial Q}{\partial y}+\frac{\partial R}{\partial z}\right)dV=\iint_\Sigma P\,dy dz+Q\,dz dx+R\,dx dy
$$

**证.** 先设 $\Omega$ 是长方体 $[a,b]\times[c,d]\times[e,f]$，只看含 $R$ 的一项：先对 $z$ 用牛顿–莱布尼茨公式，再对 $x,y$ 积分，

$$
\iiint_\Omega\frac{\partial R}{\partial z}\,dV=\iint_{D_{xy}}\left(\int_e^f\frac{\partial R}{\partial z}\,dz\right)dx dy=\iint_{D_{xy}}\left[R(x,y,f)-R(x,y,e)\right]dx dy
$$

而上底取外侧即上侧，贡献 $+\iint R\,dx dy$；下底取外侧即下侧，贡献 $-\iint R\,dx dy$；四个侧面的法向量垂直于 $z$ 轴，$\cos\gamma=0$，贡献为 $0$。所以右边正是 $\iint_\Sigma R\,dx dy$。对 $P,Q$ 换投影面同理，三式相加即得。

**理解.** 一般区域用辅助面分割成有限个柱体，内部公共面上方向相反、积分抵消。高斯公式的向量形式为 $\iint_\Sigma\vec{F}\cdot\vec{n}\,dS=\iiint_\Omega\mathrm{div}\,\vec{F}\,dV$，其中 $\mathrm{div}\,\vec{F}=\frac{\partial P}{\partial x}+\frac{\partial Q}{\partial y}+\frac{\partial R}{\partial z}$ 是散度：单位体积内流体净流出的量，$>0$ 为源、$<0$ 为汇、处处为零是无源场。

**易错点.** 必须"闭曲面取外侧"；曲面不封闭就先补面再用，最后减掉补面上的积分。

#### 11.6.2 斯托克斯公式与旋度

设 $\Sigma$ 是分片光滑的有向曲面，边界 $\Gamma$ 是分段光滑闭曲线，$\Gamma$ 的方向与 $\Sigma$ 的侧符合右手法则：

$$
\iint_\Sigma\left(\frac{\partial R}{\partial y}-\frac{\partial Q}{\partial z}\right)dy dz+\left(\frac{\partial P}{\partial z}-\frac{\partial R}{\partial x}\right)dz dx+\left(\frac{\partial Q}{\partial x}-\frac{\partial P}{\partial y}\right)dx dy=\oint_\Gamma P\,dx+Q\,dy+R\,dz
$$

**证.** 设 $\Sigma:z=z(x,y)$，投影区域为 $D$，$\Gamma$ 的投影是 $D$ 的正向边界 $l$。先证只含 $R$ 的项。由 $dz=z_x\,dx+z_y\,dy$，记 $\tilde R(x,y)=R(x,y,z(x,y))$，用格林公式：

$$
\oint_\Gamma R\,dz=\oint_l\left(\tilde R z_x\,dx+\tilde R z_y\,dy\right)=\iint_D\left[\left(\tilde R z_y\right)_x-\left(\tilde R z_x\right)_y\right]dx dy
$$

**证.** 注意 $\tilde R$ 通过 $z$ 间接依赖 $x,y$，展开全导数时 $R_z z_xz_y$ 这类项正好抵消，得 $\left(\tilde R z_y\right)_x-\left(\tilde R z_x\right)_y=R_xz_y-R_yz_x$。而 $\Sigma$ 上 $dy dz=-z_x\,dx dy$，$dz dx=-z_y\,dx dy$，故上式等于 $\iint_\Sigma\left(R_y\,dy dz-R_x\,dz dx\right)$。对 $P,Q$ 轮换同理，三式相加即得。

**理解.** 取 $\Sigma$ 为 $xOy$ 平面上的区域，此时 $\vec{n}=\vec{k}$，$\cos\alpha=\cos\beta=0$，$\cos\gamma=1$，斯托克斯公式退化为 $\oint_L P\,dx+Q\,dy=\iint_D(Q_x-P_y)\,dx dy$，正是格林公式。所以它是格林公式在空间的推广：格林把平面区域化成平面边界，斯托克斯把空间曲面化成空间边界，证明手段都是"投影到平面 $+$ 格林"。

**易错点.** 三个分量容易记混，用行列式记：$\mathrm{rot}\,\vec{F}=\begin{vmatrix}\vec{i}&\vec{j}&\vec{k}\\[2pt]\partial_x&\partial_y&\partial_z\\P&Q&R\end{vmatrix}=(R_y-Q_z,\ P_z-R_x,\ Q_x-P_y)$，即旋度，物理意义是"环量的面密度"。向量形式为 $\oint_\Gamma\vec{F}\cdot d\vec{r}=\iint_\Sigma\mathrm{rot}\,\vec{F}\cdot\vec{n}\,dS$。

### 11.7 补线/补面技巧

格林公式要求闭曲线、高斯公式要求闭曲面，题目给的往往不封闭，实操就三条规则：

1. **能补就补。** 缺一段边界就补直线或折线，缺一块曲面就补平面（常用坐标面或平面圆盘）把口封上；用完公式**再减去**补线/补面上的积分。
2. **方向对齐。** 补的线要与原曲线顺次相接，使合成曲线为正向；补的面要与原曲面同取外侧，合成后才是闭曲面的外侧，否则整体差一个负号。
3. **补的面要让投影简单。** 优先选平行于坐标面的平面，这样 $dy dz,dz dx,dx dy$ 至少两个为零，补面上的积分常直接为 $0$。区域内有奇点时"挖"一个小圆或小球面，取内侧，再夹逼。**易错点.** 最常见的错误是补完忘记减掉补面上的积分，或者方向没接对导致符号反。算完用对称性或数量级验算一遍。

## 12. 无穷级数

级数这章我一开始学得很虚：判别法一堆，每个都会套，合上书却说不清为什么。后来按“先问和存不存在，再问怎么判，最后问怎么把函数拆成级数”重排了一遍，才顺过来。

### 12.1 常数项级数的概念与性质

“把无穷多个数加起来”本身没有定义，所以先退一步：只加前 $n$ 项。

$$
S_n=u_1+u_2+\cdots+u_n
$$

$S_n$ 叫部分和。级数 $\sum_{n=1}^{\infty}u_n$ 收敛，指部分和数列有极限 $\lim_{n\to\infty}S_n=S$，$S$ 叫级数的和；极限不存在就是发散。

**理解.** 级数的“和”是部分和数列的极限，不是真把无穷多项加完。发散也不一定等于“和是无穷大”，$\sum_{n=1}^{\infty}(-1)^{n-1}$ 就只在 $1$ 和 $0$ 之间跳。

先吃透几何级数，后面的判别法都拿它当尺子。

$$
\sum_{n=0}^{\infty}aq^n=a+aq+aq^2+\cdots\quad(a\ne0)
$$

**证.** $q\ne1$ 时把 $S_n$ 与 $qS_n$ 相减，中间项全消，得封闭形式

$$
S_n=a\frac{1-q^n}{1-q}
$$

于是 $|q|<1$ 时 $q^n\to0$，$S_n\to\frac{a}{1-q}$，收敛；$|q|\ge1$ 时 $q^n$ 不趋于 $0$（$q=1$ 时 $S_n=na$），发散。

**易错点.** 和是 $\frac{a}{1-q}$，分子是首项 $a$ 而不是 $aq$；$q=-1$ 时通项不趋于 $0$，直接发散，别代公式。

第二个基准是调和级数：

$$
1+\frac12+\left(\frac13+\frac14\right)+\left(\frac15+\cdots+\frac18\right)+\cdots
$$

**证.** 按 $2$ 的幂分组，第 $k$ 组从 $\frac{1}{2^{k-1}+1}$ 到 $\frac{1}{2^k}$ 共 $2^{k-1}$ 项，每项不小于 $\frac{1}{2^k}$，整组和不小于 $\frac{1}{2}$，所以 $S_{2^k}\ge1+\frac{k}{2}$，部分和无界，级数发散。通项 $\frac{1}{n}\to0$ 却发散，这个反差要记住。

三条常用性质：线性，即都收敛时 $\sum(\alpha u_n+\beta v_n)=\alpha\sum u_n+\beta\sum v_n$；收敛级数任意加括号仍收敛于同一和，因为新部分和是原部分和的子列，但逆命题不成立，$(1-1)+(1-1)+\cdots$ 收敛而 $1-1+1-\cdots$ 发散；收敛的必要条件是 $u_n\to0$，因为 $u_n=S_n-S_{n-1}\to S-S=0$。

**易错点.** 必要条件只能判发散：通项不趋于 $0$ 必发散，反之不然，调和级数就是反例。

### 12.2 正项级数审敛法

正项级数部分和单调递增，所以“有界”就是“收敛”。

**理解.** $u_n\ge0$ 时 $S_n$ 只增不减，单调有界定理直接给出：收敛 $\Leftrightarrow$ 部分和有上界。所以正项级数只有收敛和发散到 $+\infty$ 两种结局，不会振荡。

**比较判别法.** 设 $0\le u_n\le v_n$：$\sum v_n$ 收敛则 $\sum u_n$ 收敛，$\sum u_n$ 发散则 $\sum v_n$ 发散。**极限形式.** 设 $v_n>0$，$\lim_{n\to\infty}\frac{u_n}{v_n}=l$：$0<l<+\infty$ 时同敛散；$l=0$ 时 $\sum v_n$ 收敛可推出 $\sum u_n$ 收敛；$l=+\infty$ 时 $\sum v_n$ 发散可推出 $\sum u_n$ 发散。

**p 级数 $\sum\frac{1}{n^p}$：$p>1$ 收敛，$p\le1$ 发散。证.** $p\le1$ 时 $\frac{1}{n^p}\ge\frac{1}{n}$，与调和级数比较即发散。$p>1$ 时用积分放缩：

$$
S_n\le1+\int_1^{n}\frac{dx}{x^p}=1+\frac{1-n^{1-p}}{p-1}\le1+\frac{1}{p-1}
$$

部分和有上界，收敛。

**易错点.** $p=1$ 最容易记反，它是发散的。

**比值判别法（达朗贝尔）.** $u_n>0$，$\lim_{n\to\infty}\frac{u_{n+1}}{u_n}=\rho$：$\rho<1$ 收敛，$\rho>1$ 发散，$\rho=1$ 失效。

**证.** $\rho<1$ 时取 $q\in(\rho,1)$，从某项起 $\frac{u_{n+1}}{u_n}<q$，连乘得 $u_n\le u_Nq^{n-N}$，与公比 $q<1$ 的几何级数比较即收敛；$\rho>1$ 时从某项起 $u_{n+1}>u_n$，通项不趋于 $0$。

**根值判别法（柯西）.** $u_n>0$，$\lim_{n\to\infty}\sqrt[n]{u_n}=\rho$，规则同比值法。

**证.** $\rho<1$ 时取 $q\in(\rho,1)$，从某项起 $u_n<q^n$，与几何级数比较。

**易错点.** $\rho=1$ 时两法都失效，换比较法；用前先确认 $u_n>0$；见阶乘想比值法，见 $n$ 次方想根值法。

### 12.3 交错级数与绝对收敛

**莱布尼茨定理.** 设 $u_n>0$、$u_{n+1}\le u_n$、$u_n\to0$，则 $\sum_{n=1}^{\infty}(-1)^{n-1}u_n$ 收敛，且和的绝对值不超过 $u_1$。

**证.** 偶数项部分和

$$
S_{2n}=(u_1-u_2)+(u_3-u_4)+\cdots+(u_{2n-1}-u_{2n})
$$

每个括号非负，故单调递增；又 $S_{2n}=u_1-(u_2-u_3)-\cdots-u_{2n}\le u_1$，有上界，所以 $S_{2n}\to S$。而 $S_{2n-1}=S_{2n}+u_{2n}$，$u_{2n}\to0$，故 $S_{2n-1}\to S$。两个子列同极限，部分和数列收敛。

**绝对收敛.** 若 $\sum|u_n|$ 收敛，则 $\sum u_n$ 收敛。

**证.** 记 $v_n=u_n+|u_n|$，则 $0\le v_n\le2|u_n|$，由比较判别法 $\sum v_n$ 收敛；而 $u_n=v_n-|u_n|$ 是两个收敛级数之差。

**条件收敛.** $\sum|u_n|$ 发散而 $\sum u_n$ 收敛，称条件收敛，例如 $\sum_{n=1}^{\infty}\frac{(-1)^{n-1}}{n}=1-\frac12+\frac13-\cdots$。

**理解.** 莱布尼茨定理保证它收敛，但绝对值级数是调和级数，所以是条件收敛，和为 $\ln2$，12.5 节用逐项积分能算出来。

**易错点.** 绝对收敛一定收敛，反之不然；条件收敛的级数不能随便重排，重排会改和，绝对收敛的才可以。

### 12.4 幂级数

把数项换成函数项就是函数项级数 $\sum u_n(x)$，最规整的是幂级数 $\sum_{n=0}^{\infty}a_n(x-x_0)^n$。

**阿贝尔定理.** 若它在 $x_1\ne x_0$ 处收敛，则对一切 $|x-x_0|<|x_1-x_0|$ 的 $x$ 绝对收敛；若在 $x_2\ne x_0$ 处发散，则对一切 $|x-x_0|>|x_2-x_0|$ 的 $x$ 发散。

**证.** 取 $x_0=0$。$\sum a_nx_1^n$ 收敛，故 $a_nx_1^n\to0$，有界：$|a_nx_1^n|\le M$。于是对 $|x|<|x_1|$，

$$
|a_nx^n|=|a_nx_1^n|\cdot\left|\frac{x}{x_1}\right|^n\le Mq^n,\quad q=\left|\frac{x}{x_1}\right|<1
$$

与几何级数比较即绝对收敛。后半句是前半句的逆否命题。

**理解.** 收敛点构成以 $x_0$ 为中心的区间：存在 $R\in[0,+\infty]$，$|x-x_0|<R$ 内绝对收敛、$|x-x_0|>R$ 外发散，$R$ 叫收敛半径，开区间叫收敛区间。

**收敛半径.** 设 $\lim_{n\to\infty}\left|\frac{a_{n+1}}{a_n}\right|=\rho$，则

$$
R=\frac{1}{\rho}
$$

**证.** 对绝对值级数用比值法，相邻两项之比趋于 $\rho|x-x_0|$：小于 $1$ 时绝对收敛，即 $|x-x_0|<\frac{1}{\rho}$；大于 $1$ 时通项不趋于 $0$，发散。约定 $\rho=0$ 时 $R=+\infty$，$\rho=+\infty$ 时 $R=0$。

**易错点.** 公式里是比值的极限，不是 $a_n$ 的极限；缺项幂级数要先把 $x$ 看成整体再算；端点 $x=x_0\pm R$ 处必须代回原级数单独判。

收敛区间内部性质很好：和函数连续；可逐项求导 $S'(x)=\sum_{n=1}^{\infty}na_n(x-x_0)^{n-1}$；可逐项积分 $\int_{x_0}^{x}S(t)\,dt=\sum_{n=0}^{\infty}\frac{a_n}{n+1}(x-x_0)^{n+1}$。

**理解.** 求导是系数乘 $n$，积分是系数除以 $n+1$，而 $\sqrt[n]{n}\to1$ 不改变 $\lim\sqrt[n]{|a_n|}$，所以半径不变；端点敛散性可能被破坏，要另算。

### 12.5 函数展开成幂级数

若 $f$ 在 $x_0$ 邻域内无穷可导，它的泰勒级数是

$$
\sum_{n=0}^{\infty}\frac{f^{(n)}(x_0)}{n!}(x-x_0)^n
$$

$x_0=0$ 时叫麦克劳林级数。

**易错点.** 泰勒级数收敛不代表收敛到 $f$：$f(x)=e^{-1/x^2}$（$x\ne0$）、$f(0)=0$ 的各阶导数在 $0$ 处全为 $0$，级数恒等于 $0$，只在 $x=0$ 处等于 $f$。所以要么给余项估计，要么用已知展开式做运算。

所有展开式都从几何级数长出来：

$$
\frac{1}{1-x}=1+x+x^2+\cdots=\sum_{n=0}^{\infty}x^n,\quad |x|<1
$$

**证.** 这是 $a=1$、$q=x$ 的几何级数，$S_n=\frac{1-x^n}{1-x}$，$|x|<1$ 时 $x^n\to0$，得 $\frac{1}{1-x}$；端点 $x=\pm1$ 处通项不趋于 $0$，发散。

把 $x$ 换成 $-t$ 逐项积分：

$$
\ln(1+x)=\int_0^x\frac{dt}{1+t}=\sum_{n=1}^{\infty}\frac{(-1)^{n-1}}{n}x^n,\quad -1<x\le1
$$

$x=1$ 时右边是 $1-\frac12+\frac13-\cdots=\ln2$；$x=-1$ 时是调和级数，发散。再把 $x$ 换成 $-t^2$：

$$
\arctan x=\int_0^x\frac{dt}{1+t^2}=\sum_{n=0}^{\infty}\frac{(-1)^n}{2n+1}x^{2n+1},\quad -1\le x\le1
$$

$x=1$ 时得 $\frac{\pi}{4}=1-\frac13+\frac15-\cdots$。

常用展开式按收敛域列一遍：

- $e^x=\sum_{n=0}^{\infty}\frac{x^n}{n!}$，$x\in(-\infty,+\infty)$。
- $\sin x=\sum_{n=0}^{\infty}\frac{(-1)^nx^{2n+1}}{(2n+1)!}$，$x\in(-\infty,+\infty)$。
- $\cos x=\sum_{n=0}^{\infty}\frac{(-1)^nx^{2n}}{(2n)!}$，$x\in(-\infty,+\infty)$。
- $\ln(1+x)=\sum_{n=1}^{\infty}\frac{(-1)^{n-1}}{n}x^n$，$x\in(-1,1]$。
- $\frac{1}{1-x}=\sum_{n=0}^{\infty}x^n$，$x\in(-1,1)$。
- $\arctan x=\sum_{n=0}^{\infty}\frac{(-1)^n}{2n+1}x^{2n+1}$，$x\in[-1,1]$。
- $(1+x)^\alpha=1+\alpha x+\frac{\alpha(\alpha-1)}{2!}x^2+\cdots$，$x\in(-1,1)$；$\alpha>0$ 时两端都收敛，$\alpha<0$ 时两端发散。

**易错点.** 七个式子里只有 $\ln(1+x)$（右端点）和 $\arctan x$（两端）带端点；$e^x$、$\sin x$、$\cos x$ 收敛域是全体实数；$\frac{1}{1-x}$ 两端都不带；$(1+x)^\alpha$ 在 $\alpha$ 为正整数时退化成有限项。

彩蛋：把 $e^{i\theta}$ 代进 $e^x$ 的展开式，用 $i^{2n}=(-1)^n$、$i^{2n+1}=(-1)^ni$：

$$
e^{i\theta}=\sum_{n=0}^{\infty}\frac{(i\theta)^n}{n!}=\left(1-\frac{\theta^2}{2!}+\cdots\right)+i\left(\theta-\frac{\theta^3}{3!}+\cdots\right)=\cos\theta+i\sin\theta
$$

**理解.** 这就是欧拉公式：$e^x$ 的展开式把 $\sin$、$\cos$ 的展开式装进同一个框，实部是 $\cos$、虚部是 $\sin$，所以这两个展开式不用硬背。

### 12.6 傅里叶级数

幂级数用多项式逼近，傅里叶级数改用三角函数系 $1,\cos x,\sin x,\cos2x,\sin2x,\dots$ 逼近。它在 $[-\pi,\pi]$ 上正交：不同函数相乘积分是 $0$。例如

$$
\int_{-\pi}^{\pi}\sin nx\sin mx\,dx=0\quad(n\ne m)
$$

**证.** 积化和差 $\sin nx\sin mx=\frac12[\cos(n-m)x-\cos(n+m)x]$，而整数 $k\ne0$ 时

$$
\int_{-\pi}^{\pi}\cos kx\,dx=\frac{2\sin k\pi}{k}=0
$$

两项都是 $0$。$n=m$ 时 $\int_{-\pi}^{\pi}\sin^2nx\,dx=\frac12\int_{-\pi}^{\pi}(1-\cos2nx)\,dx=\pi$；$\cos$ 乘 $\cos$ 同理，$\sin$ 乘 $\cos$ 恒为 $0$。

正交性让我们能反解系数。设

$$
f(x)\sim\frac{a_0}{2}+\sum_{n=1}^{\infty}\left(a_n\cos nx+b_n\sin nx\right)
$$

**系数公式.**

$$
a_n=\frac{1}{\pi}\int_{-\pi}^{\pi}f(x)\cos nx\,dx\quad(n=0,1,2,\dots)
$$

$$
b_n=\frac{1}{\pi}\int_{-\pi}^{\pi}f(x)\sin nx\,dx\quad(n=1,2,\dots)
$$

**证.** 两边乘 $\cos kx$ 后逐项积分，由正交性只剩 $\int_{-\pi}^{\pi}a_k\cos^2kx\,dx=a_k\pi$，故 $a_k=\frac{1}{\pi}\int_{-\pi}^{\pi}f(x)\cos kx\,dx$，取 $k=0$ 得 $a_0$；乘 $\sin kx$ 同理得 $b_k$。

**理解.** 常数项写成 $\frac{a_0}{2}$ 是为了让 $n=0$ 与 $n\ge1$ 共用一个公式，不是笔误。

**收敛定理（狄利克雷）.** 若 $f$ 在 $[-\pi,\pi]$ 上分段单调、只有有限个第一类间断点，则傅里叶级数处处收敛，连续点收敛到 $f(x)$，间断点收敛到 $\frac{f(x^-)+f(x^+)}{2}$。

**易错点.** 间断点收的是左右极限的平均值，不是 $f(x_0)$；端点 $x=\pm\pi$ 按周期延拓看，收的是 $\frac{f(\pi^-)+f(-\pi^+)}{2}$。

奇偶性省一半计算：$f$ 为奇函数时 $a_n=0$，只剩正弦项，$b_n=\frac{2}{\pi}\int_0^{\pi}f(x)\sin nx\,dx$；$f$ 为偶函数时 $b_n=0$，只剩余弦项，$a_n=\frac{2}{\pi}\int_0^{\pi}f(x)\cos nx\,dx$。

**证.** 奇函数乘 $\cos nx$ 仍是奇函数，对称区间积分为 $0$，故 $a_n=0$；偶函数在对称区间上的积分等于 $[0,\pi]$ 上积分的两倍，所以系数从 $\frac{1}{\pi}$ 变成 $\frac{2}{\pi}$。

只给 $[0,\pi]$ 上的函数也能展开，靠延拓：奇延拓（再作 $2\pi$ 周期延拓）得正弦级数，$b_n=\frac{2}{\pi}\int_0^{\pi}f(x)\sin nx\,dx$；偶延拓得余弦级数，$a_n=\frac{2}{\pi}\int_0^{\pi}f(x)\cos nx\,dx$。

**理解.** 同一个 $[0,\pi]$ 上的函数，想变奇函数就用正弦级数，想变偶函数就用余弦级数；两种和函数不同，但在 $(0,\pi)$ 内都等于 $f(x)$。级数这章说到底就三件事——部分和有没有极限、拿谁当尺子、按哪组基拆函数。