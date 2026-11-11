---
publishDate: 2026-11-11T22:00:00Z
author: Mobell
title: 高等数学公式
excerpt: 高数是物理、计算机等学科的共同底座，真正难的不是把公式背下来，而是知道每个公式从哪里来、什么时候能用。这篇文章把高数的核心公式按章节整理成一份随时可查的手册，并对其中较复杂的公式补上了推导过程。
image: /images/blog/matgongshi.webp
imageAlt: 高等数学公式文章封面插画
category: Host
tags:
  - 数学
  - 高数
  - 公式
  - 大学
---
课本上的公式是散的，考场上想不起来的往往不是"公式长什么样"，而是"它怎么来的、什么时候能用、代进去要注意什么"。所以下面每一节都尽量按同一个套路写：

- **公式**：原样列出来，方便查。
- **理解**：一两句话说明它是干什么的、几何上长什么样。
- **推导 / 证明**：只挑比较复杂的公式给，简单的不硬凑；每步尽量写清依据。
- **易错点**

公式本身不用死背，用得多了自然就记住了。

## 目录

1. [函数与极限](#1-函数与极限)
2. [导数与微分](#2-导数与微分)
3. [微分中值定理与导数的应用](#3-微分中值定理与导数的应用)
4. [不定积分](#4-不定积分)
5. [定积分](#5-定积分)
6. [定积分的应用](#6-定积分的应用)
7. [微分方程](#7-微分方程)
8. [向量代数与空间解析几何](#8-向量代数与空间解析几何)
9. [多元函数微分法及其应用](#9-多元函数微分法及其应用)
10. [重积分](#10-重积分)
11. [曲线积分与曲面积分](#11-曲线积分与曲面积分)
12. [无穷级数](#12-无穷级数)

## 1. 函数与极限

### 1.1 函数与常用恒等式

极限、导数、积分都在描述"函数怎么变"，如果对定义域、奇偶性、周期性不敏感，很多题会在一开始就绕远路。这一节先把后面要反复用到的恒等式集中放好。

#### 1.1.1 幂、指数、对数

- 幂运算：$a^m a^n=a^{m+n}$，$(a^m)^n=a^{mn}$，$(ab)^n=a^n b^n$，$a^{-n}=\frac{1}{a^n}$，$a^{m/n}=\sqrt[n]{a^m}$（$a>0$）
- 指数与对数互逆：$a^{\log_a x}=x\ (x>0)$，$\log_a a^x=x$
- 对数运算：

$$
\log_a(MN)=\log_a M+\log_a N
$$

$$
\log_a\frac{M}{N}=\log_a M-\log_a N
$$

$$
\log_a M^n=n\log_a M
$$

$$
\log_a b=\frac{\ln b}{\ln a}
$$

**推导（换底公式）.** 设 $y=\log_a b$，按定义就是 $a^y=b$。两边同时取自然对数，得 $y\ln a=\ln b$，所以 $y=\frac{\ln b}{\ln a}$。同理 $\log_a b=\frac{\log_c b}{\log_c a}$。

**易错点.** $\log_a(M+N)$ 没有任何化简公式，$\log_a M+\log_a N$ 里 $M,N$ 必须都是正数。

#### 1.1.2 三角恒等式

最基本的平方关系（$x$ 不取使另一侧无意义的值）：

$$
\sin^2 x+\cos^2 x=1
$$

$$
1+\tan^2 x=\sec^2 x
$$

$$
1+\cot^2 x=\csc^2 x
$$

**证.** 前两条就是第一条两边分别除以 $\cos^2 x$ 和 $\sin^2 x$。

和角公式：

$$
\sin(A\pm B)=\sin A\cos B\pm\cos A\sin B
$$

$$
\cos(A\pm B)=\cos A\cos B\mp\sin A\sin B
$$

$$
\tan(A\pm B)=\frac{\tan A\pm\tan B}{1\mp\tan A\tan B}
$$

**证（和角公式）.** 在单位圆上取 $P(\cos\alpha,\sin\alpha)$、$Q(\cos\beta,\sin\beta)$。

一方面，用两点间距离公式：

$$
|PQ|^2=(\cos\alpha-\cos\beta)^2+(\sin\alpha-\sin\beta)^2=2-2(\cos\alpha\cos\beta+\sin\alpha\sin\beta)
$$

另一方面，$P,Q$ 对应的圆心角是 $|\alpha-\beta|$，由余弦定理 $|PQ|^2=2-2\cos(\alpha-\beta)$。两式相等就得到

$$
\cos(\alpha-\beta)=\cos\alpha\cos\beta+\sin\alpha\sin\beta
$$

把 $\beta$ 换成 $-\beta$，利用 $\cos$ 偶、$\sin$ 奇，得 $\cos(\alpha+\beta)=\cos\alpha\cos\beta-\sin\alpha\sin\beta$。

再用诱导公式 $\cos\left(\frac{\pi}{2}-u\right)=\sin u$、$\sin\left(\frac{\pi}{2}-u\right)=\cos u$：

$$
\sin(\alpha+\beta)=\cos\left(\frac{\pi}{2}-\alpha-\beta\right)=\cos\left[\left(\frac{\pi}{2}-\alpha\right)-\beta\right]=\sin\alpha\cos\beta+\cos\alpha\sin\beta
$$

同理得 $\sin(\alpha-\beta)$。$\tan$ 的两条用 $\tan=\frac{\sin}{\cos}$ 相除即可。

倍角与半角（把和角公式中 $A=B=x$ 代进去就是倍角）：

$$
\sin 2x=2\sin x\cos x
$$

$$
\cos 2x=\cos^2 x-\sin^2 x=2\cos^2 x-1=1-2\sin^2 x
$$

$$
\tan 2x=\frac{2\tan x}{1-\tan^2 x}
$$

$$
\sin^2 x=\frac{1-\cos 2x}{2},\qquad \cos^2 x=\frac{1+\cos 2x}{2}
$$

$$
\tan\frac{x}{2}=\frac{1-\cos x}{\sin x}=\frac{\sin x}{1+\cos x}
$$

积化和差（把上面四条和角公式两两相加减）：

$$
\sin\alpha\cos\beta=\frac{1}{2}\left[\sin(\alpha+\beta)+\sin(\alpha-\beta)\right]
$$

$$
\cos\alpha\sin\beta=\frac{1}{2}\left[\sin(\alpha+\beta)-\sin(\alpha-\beta)\right]
$$

$$
\cos\alpha\cos\beta=\frac{1}{2}\left[\cos(\alpha+\beta)+\cos(\alpha-\beta)\right]
$$

$$
\sin\alpha\sin\beta=\frac{1}{2}\left[\cos(\alpha-\beta)-\cos(\alpha+\beta)\right]
$$

和差化积（在积化和差里令 $A=\alpha+\beta,\ B=\alpha-\beta$ 反推）：

$$
\sin A+\sin B=2\sin\frac{A+B}{2}\cos\frac{A-B}{2}
$$

$$
\sin A-\sin B=2\cos\frac{A+B}{2}\sin\frac{A-B}{2}
$$

$$
\cos A+\cos B=2\cos\frac{A+B}{2}\cos\frac{A-B}{2}
$$

$$
\cos A-\cos B=-2\sin\frac{A+B}{2}\sin\frac{A-B}{2}
$$

万能公式（令 $t=\tan\frac{x}{2}$，注意 $x\neq\pi+2k\pi$）：

$$
\sin x=\frac{2t}{1+t^2},\qquad \cos x=\frac{1-t^2}{1+t^2},\qquad \tan x=\frac{2t}{1-t^2}
$$

**推导（万能公式）.** 记 $u=\frac{x}{2}$，则 $\sin x=2\sin u\cos u=2\tan u\cdot\cos^2 u=\frac{2t}{1+t^2}$，最后一步用了 $\cos^2 u=\frac{1}{1+\tan^2 u}$。同理 $\cos x=\cos^2 u-\sin^2 u=\frac{1-t^2}{1+t^2}$，两者相除得 $\tan x$。这个代换的好处是把三角函数全部变成 $t$ 的有理式，代价是要验证 $x$ 的范围。

#### 1.1.3 反三角函数

$$
\arcsin(-x)=-\arcsin x,\qquad \arccos(-x)=\pi-\arccos x,\qquad \arctan(-x)=-\arctan x
$$

$$
\arcsin x+\arccos x=\frac{\pi}{2},\qquad \arctan x+\mathrm{arccot}\,x=\frac{\pi}{2}
$$

$$
\arcsin(\sin x)=x\ \ \left(x\in\left[-\frac{\pi}{2},\frac{\pi}{2}\right]\right),\qquad \sin(\arcsin x)=x\ \ (x\in[-1,1])
$$

**证（$\arcsin x+\arccos x=\frac{\pi}{2}$）.** 设 $y=\arcsin x$，则 $y\in\left[-\frac{\pi}{2},\frac{\pi}{2}\right]$ 且 $\sin y=x$。此时 $\cos y=\sqrt{1-x^2}\ge 0$，所以

$$
\arccos x=\arccos(\sin y)=\arccos\left(\cos\left(\frac{\pi}{2}-y\right)\right)=\frac{\pi}{2}-y
$$

最后一步是因为 $\frac{\pi}{2}-y\in[0,\pi]$，正好落在 $\arccos$ 的主值区间里。

**易错点.** 第二条恒等式不能写成 $\arcsin(\sin x)=x$ 对一切 $x$ 成立，例如 $\arcsin(\sin\pi)=0\neq\pi$。

### 1.2 极限

#### 1.2.1 极限的定义

数列极限：$\lim_{n\to\infty}a_n=a$ 指对任意 $\varepsilon>0$，存在正整数 $N$，当 $n>N$ 时 $|a_n-a|<\varepsilon$。

函数极限：$\lim_{x\to x_0}f(x)=A$ 指对任意 $\varepsilon>0$，存在 $\delta>0$，当 $0<|x-x_0|<\delta$ 时 $|f(x)-A|<\varepsilon$。

还有 $x\to x_0^+$、$x\to x_0^-$、$x\to\infty$ 的版本，只是把 $0<|x-x_0|<\delta$ 换成 $0<x-x_0<\delta$、$0<x_0-x<\delta$、$|x|>X$。

**理解.** $\varepsilon$ 是"允许多接近"的误差，$\delta$（或 $N$、$X$）是"要走到多近才开始算数"。极限存在 $\iff$ 左极限与右极限都存在且相等。

#### 1.2.2 极限的性质

设 $\lim_{x\to x_0}f(x)=A$，$\lim_{x\to x_0}g(x)=B$。

- **唯一性**：极限如果存在就唯一。
- **局部有界性**：存在 $x_0$ 的某去心邻域，使 $f(x)$ 有界。
- **局部保号性**：若 $A>0$（或 $A<0$），则在 $x_0$ 的某去心邻域内 $f(x)>0$（或 $<0$）。
- **四则运算**：

$$
\lim\left[f(x)\pm g(x)\right]=A\pm B,\qquad \lim\left[f(x)g(x)\right]=AB
$$

$$
\lim\frac{f(x)}{g(x)}=\frac{A}{B}\quad(B\neq 0)
$$

**证（唯一性）.** 反设极限同时是 $A$ 和 $B$，$A\neq B$。取 $\varepsilon=\frac{|A-B|}{3}$，则当 $x$ 充分靠近 $x_0$ 时

$$
|A-B|\le|f(x)-A|+|f(x)-B|<\frac{2|A-B|}{3}
$$

矛盾，所以 $A=B$。

**证（乘积法则）.** 写

$$
f(x)g(x)-AB=\left[f(x)-A\right]g(x)+A\left[g(x)-B\right]
$$

极限存在必局部有界，设 $|g(x)|\le M$。对任意 $\varepsilon>0$，当 $x$ 充分靠近 $x_0$ 时 $|f(x)-A|<\frac{\varepsilon}{2M}$、$|g(x)-B|<\frac{\varepsilon}{2(|A|+1)}$，于是 $|f(x)g(x)-AB|<\varepsilon$。

**易错点.** 四则运算的前提是**两个极限都存在**。$\lim\frac{f}{g}$ 还要额外要求 $B\neq 0$，以及分母在去心邻域内不为零。

#### 1.2.3 夹逼准则与单调有界准则

**夹逼准则**：若在 $x_0$ 的某去心邻域内 $g(x)\le f(x)\le h(x)$，且 $\lim g(x)=\lim h(x)=A$，则 $\lim f(x)=A$。数列版本完全类似。

**单调有界准则**：单调递增且有上界的数列必收敛；单调递减且有下界的数列必收敛。

**理解.** 这两个准则解决的是"极限值算不出来，但能夹住 / 能证明存在"的情况，是后面证明两个重要极限的工具。

#### 1.2.4 两个重要极限

$$
\lim_{x\to 0}\frac{\sin x}{x}=1
$$

$$
\lim_{x\to\infty}\left(1+\frac{1}{x}\right)^x=e,\qquad \lim_{t\to 0}(1+t)^{\frac{1}{t}}=e
$$

**证（第一重要极限）.** 先看 $0<x<\frac{\pi}{2}$。在单位圆中，圆心角为 $x$ 的扇形面积 $\frac{x}{2}$ 夹在三角形面积 $\frac{\sin x}{2}$ 和直角三角形面积 $\frac{\tan x}{2}$ 之间：

$$
\frac{\sin x}{2}<\frac{x}{2}<\frac{\tan x}{2}
$$

同除以 $\frac{\sin x}{2}>0$ 得 $1<\frac{x}{\sin x}<\frac{1}{\cos x}$，即

$$
\cos x<\frac{\sin x}{x}<1
$$

$\frac{\sin x}{x}$ 是偶函数，所以 $x<0$ 时同样成立。由 $\lim_{x\to 0}\cos x=1$ 和夹逼准则，极限为 $1$。

**证（第二重要极限）.** 先看数列 $a_n=\left(1+\frac{1}{n}\right)^n$。用二项式展开：

$$
a_n=\sum_{k=0}^{n}\binom{n}{k}\frac{1}{n^k}=1+\sum_{k=1}^{n}\frac{1}{k!}\prod_{j=1}^{k-1}\left(1-\frac{j}{n}\right)
$$

每一项里的连乘都随 $n$ 变大而变大，而且 $a_{n+1}$ 比 $a_n$ 多一个正项，所以 $\{a_n\}$ 单调递增。另一方面

$$
a_n<1+\sum_{k=1}^{n}\frac{1}{k!}<1+1+\frac{1}{2}+\frac{1}{2^2}+\cdots+\frac{1}{2^{n-1}}<3
$$

因为有上界，由单调有界准则 $\{a_n\}$ 收敛，把极限记作 $e$。

再处理连续变量。对任意 $x>1$，取整数 $n$ 使 $n\le x<n+1$，则

$$
\left(1+\frac{1}{n+1}\right)^{n}\le\left(1+\frac{1}{x}\right)^{x}\le\left(1+\frac{1}{n}\right)^{n+1}
$$

两端都趋于 $e$，由夹逼准则得 $\lim_{x\to+\infty}\left(1+\frac{1}{x}\right)^x=e$。令 $t=\frac{1}{x}$ 就得到 $\lim_{t\to 0^+}(1+t)^{\frac{1}{t}}=e$，$t\to 0^-$ 的情形同理。

#### 1.2.5 无穷小与等价无穷小

若 $\lim\alpha=0$，称 $\alpha$ 为无穷小。设 $\alpha,\beta$ 都是无穷小：

- $\lim\frac{\beta}{\alpha}=0$：$\beta$ 是 $\alpha$ 的高阶无穷小，记 $\beta=o(\alpha)$
- $\lim\frac{\beta}{\alpha}=\infty$：$\beta$ 是 $\alpha$ 的低阶无穷小
- $\lim\frac{\beta}{\alpha}=c\neq 0$：同阶无穷小
- $\lim\frac{\beta}{\alpha}=1$：等价无穷小，记 $\alpha\sim\beta$

常用的等价无穷小（$x\to 0$）：

$$
\sin x\sim x,\qquad \tan x\sim x,\qquad \arcsin x\sim x,\qquad \arctan x\sim x
$$

$$
1-\cos x\sim\frac{x^2}{2},\qquad e^x-1\sim x,\qquad \ln(1+x)\sim x
$$

$$
(1+x)^{\alpha}-1\sim\alpha x,\qquad a^x-1\sim x\ln a
$$

**推导（这一组是怎么来的）.** $\sin x\sim x$ 就是第一重要极限。$\tan x=\frac{\sin x}{\cos x}\sim x$。对 $\arcsin x$ 令 $t=\arcsin x$，则 $x=\sin t$，$\frac{\arcsin x}{x}=\frac{t}{\sin t}\to 1$；$\arctan x$ 同理。$1-\cos x=2\sin^2\frac{x}{2}\sim 2\left(\frac{x}{2}\right)^2=\frac{x^2}{2}$。对 $e^x-1$ 令 $t=e^x-1$，则 $x=\ln(1+t)$，而 $\frac{e^x-1}{x}=\frac{t}{\ln(1+t)}\to 1$，两边互为倒数就得到 $\ln(1+x)\sim x$。最后 $(1+x)^\alpha-1=e^{\alpha\ln(1+x)}-1\sim\alpha\ln(1+x)\sim\alpha x$。

**易错点.** 等价替换只在**乘除因子**里可以直接用。加减里要小心，例如

$$
\sin x-\tan x=\tan x(\cos x-1)\sim x\cdot\left(-\frac{x^2}{2}\right)=-\frac{x^3}{2}
$$

如果把 $\sin x$、$\tan x$ 各自换成 $x$，会得到 $0$，把三阶的项丢掉了。

#### 1.2.6 未定式与常用求解思路

- $\frac{0}{0}$、$\frac{\infty}{\infty}$：洛必达法则（第 3 章），或先做等价替换
- $\infty-\infty$：通分、有理化、提公因式
- $0\cdot\infty$：把一个因子写成倒数搬到分母
- $1^{\infty}$、$0^0$、$\infty^0$：都是幂指函数 $f(x)^{g(x)}$，统一化成 $e^{g(x)\ln f(x)}$ 再算

**推导（$1^{\infty}$ 型的快捷公式）.** 若 $f(x)\to 1$、$g(x)\to\infty$，则

$$
\lim f^{g}=\lim e^{g\ln f}=e^{\lim g(f-1)}
$$

中间用了 $\ln f=\ln\left[1+(f-1)\right]\sim f-1$。这就是"底数减 1 乘指数"口诀的来源。

### 1.3 连续性与间断点

#### 1.3.1 连续性

$f(x)$ 在 $x_0$ 处连续 $\iff$

$$
\lim_{x\to x_0}f(x)=f(x_0)
$$

也等价于增量形式 $\lim_{\Delta x\to 0}\Delta y=0$，其中 $\Delta y=f(x_0+\Delta x)-f(x_0)$。

左连续、右连续分别把极限换成左、右极限。**连续 $\iff$ 左连续且右连续。**

**理解.** 连续就是"函数在这一点没有断"，图像可以一笔画过去；后面可导一定连续，但连续不一定可导。

#### 1.3.2 间断点的分类

若 $f$ 在 $x_0$ 的某去心邻域内有定义但不在 $x_0$ 连续，称 $x_0$ 为间断点。

- **第一类间断点**（左右极限都存在）：
  - 可去间断点：左右极限存在且相等，但不等于 $f(x_0)$ 或 $f(x_0)$ 无定义
  - 跳跃间断点：左右极限都存在但不相等
- **第二类间断点**（左右极限至少有一个不存在）：
  - 无穷间断点：某侧极限为 $\infty$，如 $\frac{1}{x}$ 在 $x=0$
  - 振荡间断点：如 $\sin\frac{1}{x}$ 在 $x=0$

#### 1.3.3 连续函数的运算与初等函数的连续性

连续函数的和、差、积、商（分母不为零）仍连续；连续函数的复合仍连续；连续单调函数的反函数也连续。由此，**初等函数在其定义区间内连续**。

#### 1.3.4 闭区间上连续函数的性质

设 $f(x)$ 在 $[a,b]$ 上连续，则：

- **有界性与最值定理**：$f$ 在 $[a,b]$ 上有界，且能取到最大值 $M$ 与最小值 $m$
- **零点定理**：若 $f(a)f(b)<0$，则存在 $\xi\in(a,b)$ 使 $f(\xi)=0$
- **介值定理**：对任意 $\mu$ 满足 $m\le\mu\le M$，存在 $\xi\in[a,b]$ 使 $f(\xi)=\mu$
- **一致连续（Cantor 定理）**：$f$ 在 $[a,b]$ 上一致连续

**证（零点定理的思路）.** 用二分法。令 $a_1=a$，$b_1=b$，取中点 $c_1=\frac{a_1+b_1}{2}$，若 $f(c_1)=0$ 就结束；否则取使两端异号的那一半作为 $[a_2,b_2]$，如此得到区间套 $[a_n,b_n]$，长度 $\frac{b-a}{2^{n-1}}\to 0$。由区间套定理存在唯一的 $\xi$ 属于所有区间，且 $a_n\to\xi$、$b_n\to\xi$。由连续性 $f(\xi)=\lim f(a_n)$，而 $f(a_n)$ 与 $f(b_n)$ 异号，极限只能为 $0$。

**易错点.** 这三条性质都依赖"闭区间 + 连续"两个条件，开区间或含间断点时结论可能不成立，例如 $f(x)=\frac{1}{x}$ 在 $(0,1)$ 上连续但无界。

## 2. 导数与微分

### 2.1 导数的定义

函数 $y=f(x)$ 在点 $x_0$ 处的导数定义为

$$
f'(x_0)=\lim_{\Delta x\to 0}\frac{f(x_0+\Delta x)-f(x_0)}{\Delta x}=\lim_{x\to x_0}\frac{f(x)-f(x_0)}{x-x_0}
$$

若这个极限存在，称 $f$ 在 $x_0$ 处可导。类似地有左导数 $f'_-(x_0)$ 与右导数 $f'_+(x_0)$，且

$$
f'(x_0)\ \text{存在}\iff f'_-(x_0)=f'_+(x_0)
$$

**理解.** 导数是"函数值对自变量的瞬时变化率"，几何上就是曲线在 $(x_0,f(x_0))$ 处切线的斜率。切线方程与法线方程分别为

$$
y-f(x_0)=f'(x_0)(x-x_0),\qquad y-f(x_0)=-\frac{1}{f'(x_0)}(x-x_0)\ \ (f'(x_0)\neq 0)
$$

**可导与连续的关系.** 可导一定连续，连续不一定可导。

**证（可导 $\Rightarrow$ 连续）.** 由可导，$\frac{\Delta y}{\Delta x}\to f'(x_0)$，于是

$$
\Delta y=\frac{\Delta y}{\Delta x}\cdot\Delta x\to f'(x_0)\cdot 0=0
$$

即 $\lim_{\Delta x\to 0}\Delta y=0$，这正是连续。

**反例（连续不可导）.** $f(x)=|x|$ 在 $x=0$ 连续，但 $f'_-(0)=-1$、$f'_+(0)=1$，左右导数不等，所以不可导。几何上这是一个"尖点"。

高阶导数就是导数的导数：$y''=(y')'$，$y^{(n)}=(y^{(n-1)})'$。若函数在区间内具有 $n$ 阶导数且 $n$ 阶导数连续，记作 $f\in C^{(n)}$。

### 2.2 基本求导公式

$$
(C)'=0,\qquad (x^{\mu})'=\mu x^{\mu-1}\ \ (\mu\in\mathbb{R})
$$

$$
(a^x)'=a^x\ln a\ (a>0,a\neq 1),\qquad (e^x)'=e^x
$$

$$
(\log_a x)'=\frac{1}{x\ln a}\ (a>0,a\neq 1),\qquad (\ln x)'=\frac{1}{x}
$$

$$
(\sin x)'=\cos x,\qquad (\cos x)'=-\sin x
$$

$$
(\tan x)'=\sec^2 x,\qquad (\cot x)'=-\csc^2 x
$$

$$
(\sec x)'=\sec x\tan x,\qquad (\csc x)'=-\csc x\cot x
$$

$$
(\arcsin x)'=\frac{1}{\sqrt{1-x^2}},\qquad (\arccos x)'=-\frac{1}{\sqrt{1-x^2}}
$$

$$
(\arctan x)'=\frac{1}{1+x^2},\qquad (\mathrm{arccot}\,x)'=-\frac{1}{1+x^2}
$$

这些公式里，三角、指数、对数、反三角的几条都是靠"定义 + 极限"推出来的，值得自己推一遍。

**证（$(\sin x)'=\cos x$）.** 用和差化积：

$$
\frac{\sin(x+h)-\sin x}{h}=\frac{2\cos\left(x+\frac{h}{2}\right)\sin\frac{h}{2}}{h}=\cos\left(x+\frac{h}{2}\right)\cdot\frac{\sin\frac{h}{2}}{\frac{h}{2}}
$$

由第一重要极限 $\frac{\sin(h/2)}{h/2}\to 1$，且 $\cos$ 连续，所以极限为 $\cos x$。

**证（$(\ln x)'=\frac{1}{x}$）.**

$$
\frac{\ln(x+h)-\ln x}{h}=\frac{1}{h}\ln\left(1+\frac{h}{x}\right)=\frac{1}{x}\ln\left(1+\frac{h}{x}\right)^{\frac{x}{h}}\to\frac{1}{x}\ln e=\frac{1}{x}
$$

**证（$(a^x)'=a^x\ln a$）.** 提出 $a^x$ 后用 $a^h-1\sim h\ln a$：

$$
\frac{a^{x+h}-a^x}{h}=a^x\cdot\frac{a^h-1}{h}\to a^x\ln a
$$

**证（反三角函数的导数）.** 用反函数求导法。设 $y=\arcsin x$，则 $x=\sin y$，$y\in\left(-\frac{\pi}{2},\frac{\pi}{2}\right)$，且

$$
\frac{dx}{dy}=\cos y=\sqrt{1-\sin^2 y}=\sqrt{1-x^2}
$$

所以 $\frac{dy}{dx}=\frac{1}{\sqrt{1-x^2}}$（在 $x=\pm 1$ 处导数不存在）。同理，$y=\arctan x$ 时

$$
\frac{dx}{dy}=\sec^2 y=1+\tan^2 y=1+x^2\ \Longrightarrow\ \frac{dy}{dx}=\frac{1}{1+x^2}
$$

**推导（反函数求导公式）.** 若 $y=f(x)$ 与 $x=\varphi(y)$ 互为反函数，且 $f'(x)\neq 0$，则

$$
[f^{-1}(y)]'=\frac{1}{f'(x)}
$$

因为 $\Delta y\neq 0$ 时 $\frac{\Delta x}{\Delta y}=1\Big/\frac{\Delta y}{\Delta x}$，令 $\Delta x\to 0$（此时 $\Delta y\to 0$）取极限即可。

### 2.3 求导法则

#### 2.3.1 四则运算

$$
(u\pm v)'=u'\pm v',\qquad (uv)'=u'v+uv',\qquad \left(\frac{u}{v}\right)'=\frac{u'v-uv'}{v^2}\ \ (v\neq 0)
$$

**证（乘积法则）.** 记 $\Delta u=u(x+\Delta x)-u(x)$，$\Delta v$ 类似，则

$$
\Delta(uv)=(u+\Delta u)(v+\Delta v)-uv=v\Delta u+u\Delta v+\Delta u\Delta v
$$

两边除以 $\Delta x$ 并令 $\Delta x\to 0$。由可导必连续，$\Delta u\to 0$，所以最后一项 $\frac{\Delta u\Delta v}{\Delta x}\to 0$。

**证（商法则）.** 把 $\frac{u}{v}$ 看成 $u\cdot v^{-1}$，用乘积法则和链式法则：

$$
\left(\frac{u}{v}\right)'=u'v^{-1}+u\cdot(-1)v^{-2}v'=\frac{u'v-uv'}{v^2}
$$

#### 2.3.2 复合函数求导（链式法则）

若 $y=f(u)$，$u=\varphi(x)$，且 $f$ 在 $u$ 处可导、$\varphi$ 在 $x$ 处可导，则

$$
\frac{dy}{dx}=\frac{dy}{du}\cdot\frac{du}{dx}=f'(u)\varphi'(x)
$$

**证（链式法则）.** 由可导的定义，

$$
\Delta y=f'(u)\Delta u+o(\Delta u),\qquad \Delta u=\varphi'(x)\Delta x+o(\Delta x)
$$

两式相除并令 $\Delta x\to 0$。注意 $\Delta u\to 0$，且 $o(\Delta u)=\Delta u\cdot\varepsilon(\Delta u)$，其中 $\varepsilon\to 0$，于是

$$
\frac{\Delta y}{\Delta x}=f'(u)\frac{\Delta u}{\Delta x}+\frac{o(\Delta u)}{\Delta u}\cdot\frac{\Delta u}{\Delta x}\to f'(u)\varphi'(x)
$$

**理解.** 链式法则可以"一层一层剥"，多元情形下写成树状图（第 9 章）。

#### 2.3.3 其他求导方法

**隐函数求导.** 若 $y=y(x)$ 由 $F(x,y)=0$ 确定，两边对 $x$ 求导，把 $y$ 看成 $x$ 的函数，解出 $y'$ 即可。例如 $x^2+y^2=1$ 两边求导得 $2x+2yy'=0$，即 $y'=-\frac{x}{y}$。

**参数方程求导.** 若 $\begin{cases}x=\varphi(t)\\ y=\psi(t)\end{cases}$，$\varphi'(t)\neq 0$，则

$$
\frac{dy}{dx}=\frac{\psi'(t)}{\varphi'(t)}
$$

二阶导数不能直接再除一次 $\varphi'(t)$，要写成

$$
\frac{d^2y}{dx^2}=\frac{d}{dt}\left(\frac{\psi'(t)}{\varphi'(t)}\right)\Big/\varphi'(t)
$$

**推导.** 一阶是 $\frac{dy}{dx}=\frac{dy/dt}{dx/dt}$。二阶是"$\frac{dy}{dx}$ 对 $x$ 求导"，即 $\frac{d}{dx}\left(\frac{dy}{dx}\right)=\frac{d}{dt}\left(\frac{dy}{dx}\right)\cdot\frac{dt}{dx}$，而 $\frac{dt}{dx}=\frac{1}{\varphi'(t)}$。

**对数求导法.** 对 $y=u(x)^{v(x)}$ 或一长串乘除、乘方、开方，先取对数再求导：

$$
\ln y=v(x)\ln u(x)\ \Longrightarrow\ \frac{y'}{y}=v'\ln u+v\frac{u'}{u}
$$

**易错点.** $y'=y\left(v'\ln u+v\frac{u'}{u}\right)$，别忘了乘回 $y$。

#### 2.3.4 高阶导数常用公式

$$
(e^x)^{(n)}=e^x,\qquad (\sin x)^{(n)}=\sin\left(x+\frac{n\pi}{2}\right),\qquad (\cos x)^{(n)}=\cos\left(x+\frac{n\pi}{2}\right)
$$

$$
(x^n)^{(n)}=n!,\qquad (\ln x)^{(n)}=\frac{(-1)^{n-1}(n-1)!}{x^n}
$$

**证（$\sin$ 的高阶导）.** 对 $n$ 归纳。$n=1$ 时 $(\sin x)'=\cos x=\sin\left(x+\frac{\pi}{2}\right)$ 成立。若 $n$ 时成立，则

$$
(\sin x)^{(n+1)}=\left[\sin\left(x+\frac{n\pi}{2}\right)\right]'=\cos\left(x+\frac{n\pi}{2}\right)=\sin\left(x+\frac{(n+1)\pi}{2}\right)
$$

**莱布尼茨公式**（乘积的高阶导）：

$$
(uv)^{(n)}=\sum_{k=0}^{n}\binom{n}{k}u^{(k)}v^{(n-k)}
$$

**证.** 对 $n$ 归纳。$n=1$ 就是乘积法则。设 $n$ 时成立，则

$$
(uv)^{(n+1)}=\sum_{k=0}^{n}\binom{n}{k}\left[u^{(k+1)}v^{(n-k)}+u^{(k)}v^{(n-k+1)}\right]
$$

重排后合并同类项，用 $\binom{n}{k}+\binom{n}{k-1}=\binom{n+1}{k}$ 即得 $n+1$ 的形式。

### 2.4 微分

函数 $y=f(x)$ 的微分定义为

$$
dy=f'(x)\,dx
$$

其中 $dx=\Delta x$ 是自变量的增量。

**理解（几何意义）.** $\Delta y$ 是曲线上真实的高度变化，$dy$ 是**切线**上的高度变化，两者相差 $o(\Delta x)$。所以 $f(x_0+\Delta x)\approx f(x_0)+f'(x_0)\Delta x$ 是"以直代曲"。

**一阶微分形式不变性.** 不论 $x$ 是自变量还是中间变量 $x=\varphi(t)$，都有

$$
dy=f'(x)\,dx
$$

**证.** 若 $x=\varphi(t)$，由链式法则 $\frac{dy}{dt}=f'(x)\varphi'(t)$，所以 $dy=f'(x)\varphi'(t)\,dt=f'(x)\,dx$。

**推导（近似计算与误差估计）.** 由 $\Delta y=dy+o(\Delta x)$：

$$
f(x_0+\Delta x)\approx f(x_0)+f'(x_0)\Delta x
$$

常用近似：$\sin x\approx x$，$e^x\approx 1+x+\frac{x^2}{2}$，$\ln(1+x)\approx x$（$|x|$ 很小）。若 $x$ 有误差 $\delta x$，则 $y$ 的绝对误差约为 $|f'(x)|\delta x$，相对误差约为 $\left|\frac{f'(x)}{f(x)}\right|\delta x$。

### 2.5 泰勒公式

设 $f(x)$ 在含 $x_0$ 的区间内有 $n+1$ 阶导数，则

$$
f(x)=\sum_{k=0}^{n}\frac{f^{(k)}(x_0)}{k!}(x-x_0)^k+R_n(x)
$$

其中**拉格朗日余项**

$$
R_n(x)=\frac{f^{(n+1)}(\xi)}{(n+1)!}(x-x_0)^{n+1}
$$

$\xi$ 介于 $x_0$ 与 $x$ 之间。$x_0=0$ 时称为麦克劳林公式。

**证（拉格朗日余项）.** 固定 $x\neq x_0$，取常数 $K$ 使

$$
f(x)=\sum_{k=0}^{n}\frac{f^{(k)}(x_0)}{k!}(x-x_0)^k+K(x-x_0)^{n+1}
$$

构造辅助函数

$$
F(t)=f(t)-\sum_{k=0}^{n}\frac{f^{(k)}(x_0)}{k!}(t-x_0)^k-K(t-x_0)^{n+1}
$$

则 $F(x)=F(x_0)=0$。对 $F$ 在 $[x_0,x]$（或 $[x,x_0]$）上反复用罗尔定理：先得到 $\xi_1$ 使 $F'(\xi_1)=0$；再在 $[x_0,\xi_1]$ 上用罗尔定理得到 $F''(\xi_2)=0$；如此 $n+1$ 次后存在 $\xi$ 使 $F^{(n+1)}(\xi)=0$。而求导 $n+1$ 次后

$$
F^{(n+1)}(t)=f^{(n+1)}(t)-K(n+1)!
$$

所以 $K=\frac{f^{(n+1)}(\xi)}{(n+1)!}$，代回即得余项。

**皮亚诺余项.** 若只假设 $f$ 在 $x_0$ 处有 $n$ 阶导数，则

$$
f(x)=\sum_{k=0}^{n}\frac{f^{(k)}(x_0)}{k!}(x-x_0)^k+o\left((x-x_0)^n\right)
$$

（反复用洛必达法则可以证明；它只保证"局部近似阶数"，不给出误差上界。）

**常用展开（先记两个，完整的表在第 12 章）.**

$$
e^x=1+x+\frac{x^2}{2!}+\cdots+\frac{x^n}{n!}+\frac{e^{\xi}}{(n+1)!}x^{n+1}
$$

$$
\sin x=x-\frac{x^3}{3!}+\frac{x^5}{5!}-\cdots+\frac{(-1)^{n}x^{2n+1}}{(2n+1)!}+o\left(x^{2n+2}\right)
$$

**理解.** 泰勒公式是"用多项式模仿函数"，阶数越高局部越像；拉格朗日余项能估误差，皮亚诺余项只能说明逼近的阶。求极限时用皮亚诺余项就够，证明不等式时常用拉格朗日余项。

## 3. 微分中值定理与导数的应用

这一章是"导数能干什么"的集中回答：中值定理把函数值和导数连起来，然后用导数判断单调性、极值、凹凸、渐近线、曲率。

### 3.1 微分中值定理

#### 3.1.1 费马引理

若 $f$ 在 $x_0$ 的某邻域内有定义，在 $x_0$ 处可导，且对邻域内所有 $x$ 有 $f(x)\le f(x_0)$（或 $f(x)\ge f(x_0)$），则

$$
f'(x_0)=0
$$

**证.** 只证极大值情形。当 $x<x_0$ 时 $\frac{f(x)-f(x_0)}{x-x_0}\ge 0$，当 $x>x_0$ 时 $\frac{f(x)-f(x_0)}{x-x_0}\le 0$。由可导，左导数等于右导数等于 $f'(x_0)$，所以 $f'(x_0)\ge 0$ 且 $f'(x_0)\le 0$，故为零。

**理解.** 极值点如果"光滑"，切线一定是水平的。反过来不成立：$f(x)=x^3$ 在 $0$ 处 $f'=0$，但不是极值点。

#### 3.1.2 罗尔定理

若 $f$ 在 $[a,b]$ 上连续，在 $(a,b)$ 内可导，且 $f(a)=f(b)$，则存在 $\xi\in(a,b)$ 使

$$
f'(\xi)=0
$$

**证.** 由闭区间连续函数的最值定理，$f$ 在 $[a,b]$ 上取到最大值 $M$ 与最小值 $m$。

若 $M=m$，则 $f$ 恒为常数，任取 $\xi\in(a,b)$ 都有 $f'(\xi)=0$。若 $M>m$，因为 $f(a)=f(b)$，最大值与最小值中至少有一个在**内部**取到，设该点为 $\xi$。$\xi$ 是极值点且可导，由费马引理 $f'(\xi)=0$。

#### 3.1.3 拉格朗日中值定理

若 $f$ 在 $[a,b]$ 上连续，在 $(a,b)$ 内可导，则存在 $\xi\in(a,b)$ 使

$$
f(b)-f(a)=f'(\xi)(b-a)
$$

**证.** 构造辅助函数

$$
F(x)=f(x)-f(a)-\frac{f(b)-f(a)}{b-a}(x-a)
$$

$F$ 在 $[a,b]$ 上连续、在 $(a,b)$ 内可导，且 $F(a)=F(b)=0$。对 $F$ 用罗尔定理，得 $\xi\in(a,b)$ 使 $F'(\xi)=0$，即

$$
f'(\xi)-\frac{f(b)-f(a)}{b-a}=0
$$

**理解.** 它的意思是"区间上平均变化率等于某点的瞬时变化率"，几何上就是"存在一条与割线平行的切线"。**有限增量公式**常写成

$$
f(x+\Delta x)-f(x)=f'(\xi)\Delta x
$$

它是用导数估计函数值变化的核心工具。

#### 3.1.4 柯西中值定理

若 $f,g$ 在 $[a,b]$ 上连续，在 $(a,b)$ 内可导，且 $g'(x)\neq 0$，则存在 $\xi\in(a,b)$ 使

$$
\frac{f(b)-f(a)}{g(b)-g(a)}=\frac{f'(\xi)}{g'(\xi)}
$$

**证.** 由 $g'(x)\neq 0$ 知 $g(b)\neq g(a)$（否则由罗尔定理存在 $g'=0$）。构造

$$
F(x)=f(x)-f(a)-\frac{f(b)-f(a)}{g(b)-g(a)}\left[g(x)-g(a)\right]
$$

则 $F(a)=F(b)=0$，用罗尔定理即得。

**理解.** 拉格朗日是柯西中 $g(x)=x$ 的特例；柯西中值定理是洛必达法则的证明基础。

### 3.2 洛必达法则

以 $x\to a$ 的 $\frac{0}{0}$ 型为例：若 $\lim_{x\to a}f(x)=\lim_{x\to a}g(x)=0$，$f,g$ 在 $a$ 的某去心邻域内可导且 $g'(x)\neq 0$，并且 $\lim_{x\to a}\frac{f'(x)}{g'(x)}$ 存在（或为 $\infty$），则

$$
\lim_{x\to a}\frac{f(x)}{g(x)}=\lim_{x\to a}\frac{f'(x)}{g'(x)}
$$

**证.** 补充定义 $f(a)=g(a)=0$，则 $f,g$ 在 $a$ 处连续。对 $x\neq a$ 用柯西中值定理，存在 $\xi$ 介于 $a,x$ 之间使

$$
\frac{f(x)}{g(x)}=\frac{f(x)-f(a)}{g(x)-g(a)}=\frac{f'(\xi)}{g'(\xi)}
$$

当 $x\to a$ 时 $\xi\to a$，右端极限就是 $\lim_{x\to a}\frac{f'(x)}{g'(x)}$。

$\frac{\infty}{\infty}$ 型、$x\to\infty$ 的情形有类似结论，只是柯西中值定理的区间换掉。

**推导（其它未定式怎么化成这两种）.**

$$
0\cdot\infty\ \Rightarrow\ \frac{f}{1/g},\qquad \infty-\infty\ \Rightarrow\ \text{通分或有理化},\qquad 1^{\infty},0^{0},\infty^{0}\ \Rightarrow\ e^{g\ln f}
$$

**易错点.** 洛必达法则有三个前提：确实是未定式、求导后的极限存在、$g'\neq 0$。$\lim_{x\to\infty}\frac{x+\sin x}{x}$ 用洛必达会得到 $\lim(1+\cos x)$ 不存在，但原极限明明是 $1$——"求导后极限不存在"时洛必达失效，要换方法。

### 3.3 单调性、极值与最值

#### 3.3.1 单调性判别

设 $f$ 在 $[a,b]$ 上连续，在 $(a,b)$ 内可导：

- $f'(x)>0$ 在 $(a,b)$ 内 $\Rightarrow f$ 在 $[a,b]$ 上单调递增
- $f'(x)<0$ 在 $(a,b)$ 内 $\Rightarrow f$ 在 $[a,b]$ 上单调递减
- $f'(x)\equiv 0$ 在 $(a,b)$ 内 $\Rightarrow f$ 在该区间为常数

**证.** 任取 $x_1<x_2$，由拉格朗日中值定理

$$
f(x_2)-f(x_1)=f'(\xi)(x_2-x_1)
$$

$x_2-x_1>0$，所以符号由 $f'(\xi)$ 决定。

**理解.** 反过来，$f$ 单调递增只能推出 $f'(x)\ge 0$（例如 $x^3$ 在 $0$ 处导数为 $0$），不能推出严格大于。

#### 3.3.2 极值的充分条件

**必要条件**：若 $f$ 在 $x_0$ 处可导且取极值，则 $f'(x_0)=0$。使 $f'=0$ 的点叫驻点，但驻点不一定是极值点。

**第一充分条件**：若 $f$ 在 $x_0$ 的某去心邻域内可导且 $f'(x_0)=0$（或 $f$ 在 $x_0$ 不可导但连续），则

- $f'$ 在 $x_0$ 左正右负 $\Rightarrow x_0$ 为极大值点
- $f'$ 在 $x_0$ 左负右正 $\Rightarrow x_0$ 为极小值点
- $f'$ 在 $x_0$ 两侧同号 $\Rightarrow x_0$ 不是极值点

**第二充分条件**：若 $f'(x_0)=0$，$f''(x_0)\neq 0$，则

- $f''(x_0)>0\Rightarrow x_0$ 是极小值点
- $f''(x_0)<0\Rightarrow x_0$ 是极大值点

**证（第二充分条件）.** 由 $f''(x_0)>0$ 知 $f'$ 在 $x_0$ 附近单调递增。又 $f'(x_0)=0$，所以 $x<x_0$ 时 $f'(x)<0$，$x>x_0$ 时 $f'(x)>0$，由第一充分条件得极小值。

**求最值的方法.** 闭区间上连续函数的最大值、最小值只可能在**驻点、不可导点、端点**处取得，全部算出来比较即可。

#### 3.3.3 凹凸性与拐点

设 $f$ 在 $[a,b]$ 上连续，在 $(a,b)$ 内二阶可导：

- $f''(x)>0\Rightarrow$ 曲线是**凹的**（开口向上），切线在曲线下方
- $f''(x)<0\Rightarrow$ 曲线是**凸的**（开口向下），切线在曲线上方

拐点：连续曲线凹凸性改变的点。若 $f''(x_0)=0$ 或 $f''$ 在 $x_0$ 不存在，且 $f''$ 在 $x_0$ 两侧异号，则 $(x_0,f(x_0))$ 是拐点。

**理解.** 拐点要看二阶导**变号**，不是等于零；$y=x^4$ 在 $0$ 处 $y''=0$ 但两侧同号，不是拐点。

#### 3.3.4 渐近线

- **垂直渐近线** $x=x_0$：若 $\lim_{x\to x_0^{\pm}}f(x)=\infty$
- **水平渐近线** $y=L$：若 $\lim_{x\to\pm\infty}f(x)=L$
- **斜渐近线** $y=kx+b$：

$$
k=\lim_{x\to\infty}\frac{f(x)}{x},\qquad b=\lim_{x\to\infty}\left[f(x)-kx\right]
$$

两条极限都存在时斜渐近线存在。$k=0$ 就是水平渐近线。

#### 3.3.5 函数作图步骤

1. 确定定义域，判断奇偶性、周期性
2. 求 $f'$、$f''$，找驻点、不可导点、$f''=0$ 的点
3. 列表讨论 $f'$、$f''$ 的符号，得到单调区间、极值、凹凸区间、拐点
4. 求渐近线
5. 描出关键点、渐近线，连线

### 3.4 曲率

弧微分：

$$
ds=\sqrt{(dx)^2+(dy)^2}=\sqrt{1+(y')^2}\,dx
$$

参数方程 $x=\varphi(t),y=\psi(t)$ 时为

$$
ds=\sqrt{\left(\varphi'(t)\right)^2+\left(\psi'(t)\right)^2}\,dt
$$

曲率公式（$y=f(x)$ 二阶可导）：

$$
K=\frac{|y''|}{\left(1+(y')^2\right)^{\frac{3}{2}}}
$$

曲率半径 $R=\frac{1}{K}$。参数方程情形：

$$
K=\frac{\left|\varphi'(t)\psi''(t)-\varphi''(t)\psi'(t)\right|}{\left[\left(\varphi'(t)\right)^2+\left(\psi'(t)\right)^2\right]^{\frac{3}{2}}}
$$

**推导（曲率公式）.** 曲率定义为切线转角对弧长的变化率 $K=\left|\frac{d\alpha}{ds}\right|$，其中 $\alpha=\arctan y'$ 是切线的倾角。

$$
\frac{d\alpha}{dx}=\frac{y''}{1+(y')^2},\qquad \frac{ds}{dx}=\sqrt{1+(y')^2}
$$

两式相除：

$$
K=\left|\frac{d\alpha}{dx}\cdot\frac{dx}{ds}\right|=\frac{|y''|}{\left(1+(y')^2\right)^{\frac{3}{2}}}
$$

**易错点.** 直线的 $y''=0$，曲率为 $0$；圆上每一点的曲率都是 $\frac{1}{R}$，所以"曲率半径"这个名字正好对应圆的半径。

### 3.5 中值定理的典型用法

**证不等式.** 把要证的不等式整理成 $\frac{f(b)-f(a)}{b-a}$ 或 $f(x)-f(x_0)$ 的形状，用拉格朗日中值定理把差换成导数，再估计导数符号。例如证 $x>0$ 时 $\frac{x}{1+x}<\ln(1+x)<x$：

$$
\ln(1+x)-\ln 1=\frac{1}{\xi}x,\qquad 1<\xi<1+x
$$

于是 $\frac{x}{1+x}<\ln(1+x)<x$。另一条路是构造辅助函数 $F(x)=\ln(1+x)-\frac{x}{1+x}$ 再求导判单调。

**讨论方程根的个数.** 先求导画单调性表，确定每个单调区间端点的函数值符号，用零点定理数出根的个数。形如 $f(x)=0$ 的方程，若 $f'$ 在某区间恒正或恒负，则最多一个根。

**证明存在 $\xi$ 满足某等式.** 把结论里的 $\xi$ 换成 $x$ 写成微分方程形式，凑出辅助函数 $F$ 使 $F'(\xi)=0$，再用罗尔定理。例如证存在 $\xi$ 使 $f'(\xi)+f(\xi)=0$，就取 $F(x)=e^x f(x)$，因为 $F'(x)=e^x\left[f'(x)+f(x)\right]$。

> 未完待续……（之后继续在这里更新）