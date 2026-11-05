---
publishDate: 2026-11-05T22:00:00Z
author: Mobell
title: 对矩阵几何意义的思考
excerpt: 矩阵真的只是一个数表吗？为什么乘法要“行乘列”，单位矩阵为什么长那样，行列式又凭什么等于面积？这篇文章按我学习时的困惑顺序，从向量、基向量一路画到特征向量，尽量说人话地聊聊矩阵的几何意义。
image: 'https://mobellling.github.io/-image-/matrix.webp'
imageAlt: 深色背景上的网格与两个基向量箭头，示意一个线性变换
category: Host
tags:
  - 数学
  - 线代
  - 矩阵
  - 几何
  - 大学
---

> 这篇文章不是一份标准讲义，更像是我在学习矩阵时留下的一份“思考草稿”。它不保证严谨，但尽量把每一步“为什么”说清楚。如果哪里说错了，欢迎在评论区拍我。

## 一、我的疑惑：矩阵只是数表吗？

刚学矩阵的时候，老师在黑板上写下一个 $m\times n$ 的数表，告诉我们这叫矩阵；接着定义了加法、数乘、转置，还有一条看起来有点奇怪的乘法规则：行乘列。我照着算，作业也能做出来，但心里一直有几个疙瘩：

- 如果矩阵只是一个数表，为什么它总和“变换”“空间”绑在一起？
- 为什么单位矩阵偏偏是对角线上全是 $1$、其余是 $0$？
- 为什么矩阵乘法要定义成“行乘列”，而不是对应位置相乘？
- 行列式又是从哪冒出来的？为什么 $2\times 2$ 矩阵的行列式恰好是 $ad-bc$？

这些问题看起来互不相干，后来我慢慢发现，它们其实都在问同一件事：矩阵到底是什么。

这篇笔记按我当时的困惑顺序写：向量 → 矩阵的列 → 乘法 → 行列式 → 逆 → 秩 → 特征向量。中间也有过错误的理解，我把那些地方也留了下来，或许比正确答案更有用。

先说明一下约定：下面默认向量都是列向量，矩阵从左边乘向量；基默认取标准基 $\mathbf{e}_1=(1,0)^T$、$\mathbf{e}_2=(0,1)^T$。

## 二、向量：坐标只是一组系数

中学里的向量是一支箭头，有方向、有长度。到了大学，向量变成了“列矩阵”：

$$
\mathbf{v}=\begin{pmatrix}3\\2\end{pmatrix}.
$$

一开始我以为这只是把箭头竖着写，后来才意识到：写成 $(3,2)^T$ 的时候，我们已经默认选好了一组基。

在平面直角坐标系里，取

$$
\mathbf{e}_1=\begin{pmatrix}1\\0\end{pmatrix},
\qquad
\mathbf{e}_2=\begin{pmatrix}0\\1\end{pmatrix},
$$

那么

$$
\begin{pmatrix}3\\2\end{pmatrix}
=3\begin{pmatrix}1\\0\end{pmatrix}+2\begin{pmatrix}0\\1\end{pmatrix}
=3\mathbf{e}_1+2\mathbf{e}_2.
$$

也就是说，$(3,2)$ 这组坐标真正的意思是：沿 $\mathbf{e}_1$ 走 $3$ 步，沿 $\mathbf{e}_2$ 走 $2$ 步。点还是那个点，但“$3$ 和 $2$”不是点本身，而是它相对于 $\mathbf{e}_1$、$\mathbf{e}_2$ 的系数。

换个基，系数就会变。比如取 $\mathbf{b}_1=(2,0)^T$、$\mathbf{b}_2=(0,1)^T$，同一个点就要写成

$$
\begin{pmatrix}3\\2\end{pmatrix}
=\frac{3}{2}\mathbf{b}_1+2\mathbf{b}_2,
$$

坐标成了 $(3/2,2)$。点没有动，描述变了。（下面若无特别说明，还是回到标准基 $\mathbf{e}_1$、$\mathbf{e}_2$。）

下文配图统一用：橙色＝第一个基向量（或第一个特征方向），蓝色＝第二个，灰色＝参考网格或对照向量，青色＝变换后的像。

<figure>
  <img src="/images/blog/matrix/fig01-coordinates.png" alt="平面网格上，点 (3,2) 可以写成 3 倍 e1 加 2 倍 e2" width="1600" height="1000" loading="lazy" />
  <figcaption>图 1：同一个点，用标准基写出来就是 3e1+2e2。橙色、蓝色箭头是标准基 e1、e2，虚线是“先沿 e1 走 3 步，再沿 e2 走 2 步”的走法；图里也标出了另一种基 b1=(2,0)。</figcaption>
</figure>

这件事让我第一次把“向量”和“坐标”分开：向量是空间里的对象，坐标是它在一组基下的名字。既然坐标依赖于基，那下一个问题自然是：同一个点、同一个变换，换一组基之后该怎么记录？后来我发现，矩阵正是“记录基向量被送到哪里”的东西。

> 顺带一提，列向量是 $n\times 1$ 的矩阵，行向量是 $1\times n$ 的矩阵，上标 $T$ 表示转置。中学里横着写的 $(3,2)$，在大学里通常写成竖着的 $(3,2)^T$，本质上是同一支箭头。

## 三、单位矩阵的启发：矩阵的列，是基向量的新位置

先看最简单的矩阵——单位矩阵

$$
I=\begin{pmatrix}1&0\\0&1\end{pmatrix}.
$$

用 $I$ 乘任意向量，结果不变：

$$
I\begin{pmatrix}x\\y\end{pmatrix}=\begin{pmatrix}x\\y\end{pmatrix}.
$$

这很无聊，但换个角度看就很有意思：$I$ 的第一列是 $(1,0)^T$，第二列是 $(0,1)^T$，正好就是 $\mathbf{e}_1$、$\mathbf{e}_2$。而 $I$ 作用于它们时，也确实把两个基向量留在了原地：

$$
I\mathbf{e}_1=\mathbf{e}_1,
\qquad
I\mathbf{e}_2=\mathbf{e}_2.
$$

于是我有了一个猜想：会不会任意矩阵的列，就是 $\mathbf{e}_1$、$\mathbf{e}_2$ 经过这个矩阵变换后的新位置？

拿一般的 $2\times 2$ 矩阵

$$
A=\begin{pmatrix}a&b\\c&d\end{pmatrix}
$$

一算就发现，这不是猜想，而是乘法规则直接给出的结果：

$$
A\mathbf{e}_1
=\begin{pmatrix}a&b\\c&d\end{pmatrix}\begin{pmatrix}1\\0\end{pmatrix}
=\begin{pmatrix}a\\c\end{pmatrix},
\qquad
A\mathbf{e}_2
=\begin{pmatrix}a&b\\c&d\end{pmatrix}\begin{pmatrix}0\\1\end{pmatrix}
=\begin{pmatrix}b\\d\end{pmatrix}.
$$

$A$ 的第一列就是 $\mathbf{e}_1$ 的新位置，第二列就是 $\mathbf{e}_2$ 的新位置。到这里，“矩阵是一个数表”和“矩阵是一个变换”终于接上了：数表里的每一列，记录了一个基向量被送到了哪里；整个平面的命运，就写在这两列里。

为什么两列就能决定整个平面？因为平面里任意一个向量都能写成 $x_1\mathbf{e}_1+x_2\mathbf{e}_2$，而矩阵乘法是线性的：

$$
A\left(x_1\mathbf{e}_1+x_2\mathbf{e}_2\right)
=x_1A\mathbf{e}_1+x_2A\mathbf{e}_2
=x_1\begin{pmatrix}a\\c\end{pmatrix}+x_2\begin{pmatrix}b\\d\end{pmatrix}.
$$

换句话说，$A$ 对任意向量的作用，完全由它对两个基向量的作用决定。这也是“线性”最核心的意思：它保持线性组合（严格定义我放到本节末尾再说，因为“看起来是直的”并不够）。

这里要纠正我自己最初一个很含糊的说法。我曾在笔记里写“基向量变了，但坐标不变”，这句话很容易让人误解，而且它默认了 $A$ 的两列线性无关（也就是 $\det A\neq 0$，下一节会讲）——只有这时，两列才真的构成一组新的“网格”。更准确的说法是：原来那个点 $\mathbf{x}$ 在标准网格里的坐标是 $(x_1,x_2)$；变换后的点 $A\mathbf{x}$ 落在这张新网格里，坐标恰好仍然是 $(x_1,x_2)$——位置变了，网格也跟着变了，所以坐标看起来“没变”。如果两列共线，新网格就塌了，这套说法也就不成立。换句话说，不是点没动，而是描述点的语言换了。这也是“同一个变换，可以看成点动，也可以看成坐标系动”的来源。

举个具体的例子。取剪切矩阵

$$
H=\begin{pmatrix}1&1\\0&1\end{pmatrix}.
$$

它的两列是 $(1,0)^T$ 和 $(1,1)^T$：$\mathbf{e}_1$ 留在原地，$\mathbf{e}_2$ 被“推”到了 $(1,1)$。整个平面会怎样？每个点 $(x,y)$ 变成 $(x+y,y)$，于是竖直的网格线被推斜，水平的网格线保持水平；原来的小方格变成平行四边形，但直线还是直线，平行线还是平行线，原点也没有动，如图 2。

<figure>
  <img src="/images/blog/matrix/fig02-shear.png" alt="剪切变换前后的网格对比，左图是标准网格，右图竖线被推斜、方格变成平行四边形" width="1600" height="900" loading="lazy" />
  <figcaption>图 2：左：原来的网格；右：经过剪切矩阵 H 之后的网格。竖线被推斜，横线不动，方格变成平行四边形——但直线仍然是直线，平行线仍然平行，原点仍然不动。</figcaption>
</figure>

<figure>
  <img src="/images/blog/matrix/anim-shear.gif" alt="剪切程度从 0 连续增加到 1 再回到 0 的动画，蓝色基向量逐渐向 x 方向倾斜" width="720" height="504" loading="lazy" />
  <figcaption>动图 1：让剪切程度从 0 慢慢变到 1，再变回来。注意蓝色箭头（e2）越来越向 $x$ 方向倾斜（与 $y$ 轴的夹角从 $90^\circ$ 减到 $45^\circ$），橙色箭头（e1）始终不动，而整个网格始终由直线构成。</figcaption>
</figure>

用 $H$ 算一个点：

$$
H\begin{pmatrix}3\\2\end{pmatrix}
=3\begin{pmatrix}1\\0\end{pmatrix}+2\begin{pmatrix}1\\1\end{pmatrix}
=\begin{pmatrix}5\\2\end{pmatrix}.
$$

这个式子很值得盯一会儿：矩阵乘向量，其实就是“把向量的坐标当成系数，去组合矩阵的列”。图 3 画的就是这件事。

<figure>
  <img src="/images/blog/matrix/fig03-columns.png" alt="左图显示矩阵的两列就是两个基向量的新位置，右图显示 (3,2) 经过变换等于 3 倍第一列加 2 倍第二列" width="1600" height="1000" loading="lazy" />
  <figcaption>图 3：左：矩阵的两列就是 e1、e2 的新位置；右：(3,2) 经过变换等于 3 倍第一列加 2 倍第二列，结果落在 (5,2)。</figcaption>
</figure>

这里再吐槽一下我踩过的坑：只要求“直线还是直线、平行线还是平行线”，其实还不足以叫线性变换——平移也满足这两条，但原点被挪走了。严格说，线性要求 $T(\alpha\mathbf{u}+\beta\mathbf{v})=\alpha T(\mathbf{u})+\beta T(\mathbf{v})$；取 $\alpha=\beta=0$ 就知道原点必须不动。所以“线性”描述的不是“图像看起来是直的”，而是“它尊重线性组合”。几何上那两条性质，是它的结果，不是它的定义。

常见的几种 $2\times 2$ 变换可以排成一个“图鉴”：

<figure>
  <img src="/images/blog/matrix/fig04-zoo.png" alt="六种 2×2 线性变换的网格图：恒等、拉伸、剪切、旋转、反射、投影" width="1600" height="1100" loading="lazy" />
  <figcaption>图 4：六种常见的 $2\times 2$ 线性变换——恒等、拉伸、剪切、旋转、反射、投影（顺序与下表一致）。灰色是原来的网格，青色是单位正方形被变换后的样子。</figcaption>
</figure>

| 变换 | 矩阵 | 一句直观解释 |
| --- | --- | --- |
| 恒等 | $\begin{pmatrix}1&0\\0&1\end{pmatrix}$ | 什么都不做 |
| 拉伸 | $\begin{pmatrix}2&0\\0&1\end{pmatrix}$ | 沿 $x$ 方向拉长 2 倍 |
| 剪切 | $\begin{pmatrix}1&1\\0&1\end{pmatrix}$ | 竖直线被推斜，点沿 $x$ 方向偏移，偏移量随 $y$ 增大 |
| 旋转 | $\begin{pmatrix}0&-1\\1&0\end{pmatrix}$ | 逆时针转 90° |
| 反射 | $\begin{pmatrix}1&0\\0&-1\end{pmatrix}$ | 关于 $x$ 轴翻折 |
| 投影 | $\begin{pmatrix}1&0\\0&0\end{pmatrix}$ | 整个平面压到 $x$ 轴 |

这一节结束时，我还有一个疑问：如果矩阵代表“一次变换”，那两次变换连着做，应该怎么用一个矩阵表示？这就引出了乘法。

## 四、矩阵乘法为什么是“行乘列”？

把矩阵看成函数：$A$ 把输入向量 $\mathbf{x}$ 变成 $A\mathbf{x}$。两个变换连着做，比如先做 $A$，再做 $B$：

$$
\mathbf{x}\overset{A}{\longmapsto}A\mathbf{x}\overset{B}{\longmapsto}B(A\mathbf{x}).
$$

如果希望用“一个矩阵” $C$ 来表示这个复合变换，就要求

$$
C\mathbf{x}=B(A\mathbf{x})
$$

对所有 $\mathbf{x}$ 成立。这个 $C$ 就是 $BA$。注意顺序：先 $A$ 后 $B$，写成 $BA$（函数复合也是从右往左读）。这里特别容易记反。

那么 $C$ 长什么样？还是用“基向量去哪”来推。$C$ 的第一列是 $C\mathbf{e}_1$，也就是 $\mathbf{e}_1$ 先被 $A$ 送到 $A\mathbf{e}_1$，再被 $B$ 送到 $B(A\mathbf{e}_1)$。而 $A\mathbf{e}_1$ 正是 $A$ 的第一列。于是

$$
C\mathbf{e}_1
=B(A\mathbf{e}_1)
=B\begin{pmatrix}a_{11}\\a_{21}\end{pmatrix}
=a_{11}\mathbf{b}_1+a_{21}\mathbf{b}_2,
$$

其中 $\mathbf{b}_1$、$\mathbf{b}_2$ 是 $B$ 的两列。写成分量就是

$$
c_{i1}=b_{i1}a_{11}+b_{i2}a_{21}=\sum_{k=1}^{2} b_{ik}a_{k1}.
$$

同理，$C$ 的第 $j$ 列是

$$
c_{ij}=\sum_{k} b_{ik}a_{kj}.
$$

这就是那个看起来有点奇怪的“行乘列”：$C$ 的第 $i$ 行第 $j$ 列，等于 $B$ 的第 $i$ 行和 $A$ 的第 $j$ 列对应相乘再相加。它不是谁拍脑袋规定的算法，而是“复合变换”这件事逼出来的唯一结果。只要要求 $C\mathbf{x}=B(A\mathbf{x})$ 对所有 $\mathbf{x}$ 成立，$C$ 就只能这么算。换句话说，“行乘列”是复合变换的记账方式：$B$ 的每一行负责问“这个输入在新空间里占多少”，$A$ 的每一列负责答“它被送到哪”。

举个例子。取

$$
A=H=\begin{pmatrix}1&1\\0&1\end{pmatrix},
\qquad
B=R=\begin{pmatrix}0&-1\\1&0\end{pmatrix}.
$$

先剪切再旋转，得到

$$
BA=RH
=\begin{pmatrix}0&-1\\1&0\end{pmatrix}
\begin{pmatrix}1&1\\0&1\end{pmatrix}
=\begin{pmatrix}0&-1\\1&1\end{pmatrix}.
$$

先旋转再剪切，得到

$$
AB=HR
=\begin{pmatrix}1&1\\0&1\end{pmatrix}
\begin{pmatrix}0&-1\\1&0\end{pmatrix}
=\begin{pmatrix}1&-1\\1&0\end{pmatrix}.
$$

两者不一样。用点 $(3,2)^T$ 验一下：

- 先 $H$ 后 $R$：$H(3,2)^T=(5,2)^T$，再 $R$ 得 $(-2,5)^T$；
- 先 $R$ 后 $H$：$R(3,2)^T=(-2,3)^T$，再 $H$ 得 $(1,3)^T$。

终点确实不同。图 5 把这两条路径画了出来。

<figure>
  <img src="/images/blog/matrix/fig05-compose.png" alt="两行路径图：同一个初始点 (3,2) 先剪切后旋转到达 (-2,5)，先旋转后剪切到达 (1,3)，终点不同" width="1600" height="1100" loading="lazy" />
  <figcaption>图 5：同一个点 $(3,2)^T$ 走两条路线：上排先 H 后 R，到 $(-2,5)^T$；下排先 R 后 H，到 $(1,3)^T$。终点不同，所以 BA 不等于 AB。</figcaption>
</figure>

所以矩阵乘法不满足交换律，这不是缺陷，而是“操作的顺序有讲究”这个事实的数学表达。穿袜子再穿鞋，和先穿鞋再穿袜子，结果当然不一样；函数复合 $R\circ H$ 和 $H\circ R$ 自然也不同。不过结合律是满足的：先做 $C$、再做 $B$、最后做 $A$，写成 $(AB)C$ 和 $A(BC)$ 是一回事，因为两者都表示“按 $C$、$B$、$A$ 的顺序依次作用”。

单位矩阵 $I$ 则是“什么都不做”的变换：$IA=AI=A$。再回头看乘法规则，会发现它其实是在保证“矩阵乘矩阵”和“变换的复合”是同一件事。矩阵的大小也不是随便定的：$A$ 是 $m\times n$、$B$ 是 $k\times m$ 时，$BA$ 才有意义（它是 $k\times n$ 的）。换成变换的说法，$A$ 把 $\mathbb{R}^n$ 送到 $\mathbb{R}^m$，$B$ 再从 $\mathbb{R}^m$ 出发，中间那一维必须接得上——这就是“左矩阵的列数 = 右矩阵的行数”。接不上，复合变换就无从谈起。

## 五、行列式：空间被放大还是压扁？

学行列式时，我只记得 $2\times 2$ 的公式 $\det A=ad-bc$，完全不知道它为什么长这样。后来看图才明白：它是在说面积。

矩阵 $A$ 把单位正方形（四个角是 $(0,0)$、$(1,0)$、$(1,1)$、$(0,1)$）变成由两列张成的平行四边形。这个平行四边形的面积正好是 $|\det A|=|ad-bc|$。于是行列式的几何意义是：面积被这个变换放大了多少倍（带符号）；三维里就是体积。

为什么是 $ad-bc$？可以这样看：对整个平面做一次行列式为 $1$ 的剪切（剪切不改变面积），把第一列转到水平方向。设第一列是 $(a,c)$、第二列是 $(b,d)$，并先假设 $a\neq 0$。取剪切矩阵 $\begin{pmatrix}1&0\\-c/a&1\end{pmatrix}$，它把第一列 $(a,c)$ 变成 $(a,0)$，第二列则变成 $(b,d-bc/a)$。现在底是 $|a|$、高是 $|d-bc/a|$，面积就是

$$
|a|\cdot\left|d-\frac{bc}{a}\right|=|ad-bc|.
$$

（$a=0$ 时第一列已经在 $y$ 轴上，直接拿 $|c|$ 当底、$|b|$ 当高，也会得到同样的 $|bc|$。）

符号则记录了“定向”：如果 $\det$ 是负的，说明变换把平面翻了个面（像照镜子），比如反射矩阵的 $\det$ 就是 $-1$。

<figure>
  <img src="/images/blog/matrix/fig06-det.png" alt="三幅图展示单位正方形在剪切、拉伸、投影下的像，面积分别为 1、2、0" width="1600" height="800" loading="lazy" />
  <figcaption>图 6：三幅分别是剪切、拉伸、投影：单位正方形（虚线）被变成青色图形——前两个是平行四边形，面积分别为 1、2；投影把它压成一条线段，面积为 0。$|\det|$ 是面积倍数，符号表示是否翻转定向。</figcaption>
</figure>

几个例子放在一起看会很直观：

- 剪切 $H$ 的 $\det=1$：形状变了，面积没变；
- 拉伸 $\operatorname{diag}(2,1)$ 的 $\det=2$：面积变成原来的 $2$ 倍；
- 旋转 $90^\circ$ 的 $\det=1$：只是转了一下，面积当然不变；
- 反射 $\operatorname{diag}(1,-1)$ 的 $\det=-1$：面积不变，但定向反了；
- 投影 $\operatorname{diag}(1,0)$ 的 $\det=0$：整个平面被压成一条线，面积变成 $0$。

最后这个例子很重要：$\det=0$ 意味着“空间被压到了更低的维度”，信息丢了。这也解释了后面“为什么有些矩阵没有逆”。

到了三维，$\det$ 就是体积的缩放倍率：三阶矩阵把单位正方体变成平行六面体，体积是 $|\det|$；四维、五维同理，只是“体积”换成了更高维的体积（第九节再展开）。至于非方阵——行列式只对方阵有定义，因为行列式量的是“同一个空间被缩放了多少”，输入输出维数不同就无从比较。

## 六、逆矩阵：把变换倒回去

既然矩阵是变换，一个自然的问题是：能不能撤销？如果 $A$ 把 $\mathbf{x}$ 变成 $A\mathbf{x}$，那么有没有一个矩阵能把 $A\mathbf{x}$ 变回 $\mathbf{x}$？这就是逆矩阵：

$$
A^{-1}A=AA^{-1}=I.
$$

对 $2\times 2$ 矩阵，公式是

$$
A^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}.
$$

我先记住的是公式，后来才看懂分母里的 $\det$：如果 $\det=0$，面积已经被压成 $0$，不同的点被压到了同一个地方，当然没法唯一地倒回去。所以“$\det\neq 0$”就是“可逆”的几何条件。

举个例子，还是剪切

$$
H=\begin{pmatrix}1&1\\0&1\end{pmatrix},
\qquad
H^{-1}=\begin{pmatrix}1&-1\\0&1\end{pmatrix}.
$$

$H$ 把 $\mathbf{e}_2$ 推向右上方的 $(1,1)$，$H^{-1}$ 再把它推回 $(0,1)$，正好抵消。点 $(3,2)^T$ 经过 $H$ 到 $(5,2)^T$，再经过 $H^{-1}$ 又回到 $(3,2)^T$，网格也回到原样，如图 7。

<figure>
  <img src="/images/blog/matrix/fig07-inverse.png" alt="三幅图展示点 (3,2) 经过剪切到 (5,2)，再经过逆矩阵回到 (3,2)" width="1600" height="800" loading="lazy" />
  <figcaption>图 7：H 把点 (3,2) 送到 (5,2)，H⁻¹ 再把它送回来；网格也回到原样。可逆的前提是 det 不为 0。</figcaption>
</figure>

逆矩阵也解释了线性方程组的解法。$A\mathbf{x}=\mathbf{b}$ 可以读成“哪个向量 $\mathbf{x}$，经过 $A$ 之后会变成 $\mathbf{b}$”。如果 $A$ 可逆，两边左乘 $A^{-1}$ 就得到 $\mathbf{x}=A^{-1}\mathbf{b}$。几何上，这就是在问 $\mathbf{b}$ 的原像。如果 $A$ 不可逆，事情就分两种：$\mathbf{b}$ 根本不在 $A$ 的像里（无解），或者 $\mathbf{b}$ 在像里但有很多原像（无穷多解）——因为至少有一个方向（一般是一整块子空间）被压成了 $0$。

顺带一提，高斯消元法其实也是这个思路（$A$ 可逆时）：用一系列可逆的“简单变换”把 $A$ 变成 $I$，这些变换的复合就是 $A^{-1}$。每做一次初等行变换，相当于左乘一个初等矩阵。

## 七、秩：空间还剩下几维？

投影矩阵

$$
P=\begin{pmatrix}1&0\\0&0\end{pmatrix}
$$

把每个点 $(x,y)$ 变成 $(x,0)$：整个平面被压到了 $x$ 轴上，$y$ 轴上的所有点都被压到了原点。

这里有两个东西值得区分：

- 变换后还剩几维？答案是 $1$ 维（一条直线）。这个维数叫矩阵的**秩**，$\operatorname{rank}(P)=1$。
- 哪些方向被“消灭”了？答案是 $y$ 轴，也就是满足 $P\mathbf{x}=\mathbf{0}$ 的所有 $\mathbf{x}$。这个集合叫**零空间**（核），它的维数叫**零化度**。图 8 把这两件事分别标了出来。

<figure>
  <img src="/images/blog/matrix/fig08-rank.png" alt="投影变换把网格压到 x 轴，左侧标出零空间 y 轴，右侧标出像 x 轴" width="1600" height="900" loading="lazy" />
  <figcaption>图 8：投影把整个平面压到 $x$ 轴：像是一条直线（rank = 1），被压成 0 的方向是 $y$ 轴（零空间）。</figcaption>
</figure>

老师当时列过一串等价条件，我背了半天没背下来；后来画了投影那张图，才发现它们说的是同一件事。我后来觉得最漂亮的一个等式是——对任意 $m\times n$ 矩阵（$n$ 是列数，也就是输入空间的维数）：

$$
\operatorname{rank}(A)+\operatorname{nullity}(A)=n.
$$

直观地说，输入空间有 $n$ 维，其中一部分被压没了（零空间），剩下的就是变换后还能看到的维数（秩）。对投影 $P$ 来说，$1+1=2$，正好。

秩也可以从列向量看：$\operatorname{rank}$ 等于列向量中一组极大线性无关向量里所含向量的个数（这个数不随你选哪一组而变），也等于像空间的维数。由此得到一串等价说法（对 $n\times n$ 方阵）：

- $A$ 可逆；
- $\det A\neq 0$；
- $\operatorname{rank}(A)=n$；
- 零空间只有零向量；
- $A$ 的列线性无关。

这些说法其实在描述同一件事：变换没有把空间压扁。只要压扁了（降秩），就一定有非零向量被送到 $0$，就一定有信息丢失，就不可逆。

反过来，如果秩比 $n$ 小，那么方程组 $A\mathbf{x}=\mathbf{b}$ 要么无解，要么有无穷多解；解的集合是“一个特解 + 零空间里的任意向量”。这句话在学线性方程组时经常出现，用变换的图景看就很好理解：被压掉的方向上，怎么加都不影响结果。

## 八、特征向量：有些方向不为所动

大多数向量经过矩阵变换后，方向会改变。但有些矩阵会留下几个“特殊方向”：变换后方向不变，只是长度伸缩——这就是特征向量（当然，$\mathbf{v}$ 不能是零向量）：

$$
A\mathbf{v}=\lambda\mathbf{v}.
$$

$\lambda$ 叫特征值。不是每个矩阵都有实特征方向；纯旋转 $90^\circ$ 就一个也没有，后面会碰到。比如

$$
M=\begin{pmatrix}2&1\\1&2\end{pmatrix}.
$$

取 $\mathbf{v}_1=(1,1)^T$，有

$$
M\mathbf{v}_1=\begin{pmatrix}3\\3\end{pmatrix}=3\mathbf{v}_1;
$$

取 $\mathbf{v}_2=(1,-1)^T$，有

$$
M\mathbf{v}_2=\begin{pmatrix}1\\-1\end{pmatrix}=1\cdot\mathbf{v}_2.
$$

所以 $\mathbf{v}_1$ 方向被拉长 $3$ 倍，$\mathbf{v}_2$ 方向完全不动。图 9 画出了这两个方向和它们经过 $M$ 之后的样子；作为对比，灰色的 $\mathbf{w}=(2,0)^T$ 方向就被“拧”走了：$M\mathbf{w}=(4,2)^T$，方向和 $\mathbf{w}$ 不一样。

<figure>
  <img src="/images/blog/matrix/fig09-eigen.png" alt="特征向量示意图：v1 方向被拉长 3 倍，v2 方向不变，w 方向被拧走" width="1600" height="900" loading="lazy" />
  <figcaption>图 9：M 的两个特征方向：v1 被拉长 3 倍（橙色），v2 不动（蓝色）；灰色的 w 方向则被拧走了。</figcaption>
</figure>

求特征值的方程是 $\det(A-\lambda I)=0$，又回到了行列式。对 $M$ 来说：

$$
\det\begin{pmatrix}2-\lambda&1\\1&2-\lambda\end{pmatrix}
=(2-\lambda)^2-1=0,
$$

解得 $\lambda=3$ 或 $1$。

特征向量为什么重要？因为很多问题里，我们关心的是“反复做同一个变换”会发生什么。如果每次都被拉长 $3$ 倍，做 $k$ 次就是 $3^k$ 倍，主特征方向会迅速占据主导——这也是幂法、PageRank 等算法背后的直觉。物理里的振动模态、数据里的主成分分析（PCA），本质上也都在找“变换下不变的方向”。

一个有意思的对照：旋转 $90^\circ$ 的矩阵

$$
R=\begin{pmatrix}0&-1\\1&0\end{pmatrix}
$$

没有实特征向量。原因很直观：每个非零向量都被转走了，没有任何方向能保持不变。算一下特征方程 $\lambda^2+1=0$，得到 $\lambda=\pm i$——复数特征值在这里出现，并不是数学家的恶作剧，而是在说“这个变换在实数平面里没有不变方向”。顺带一提，转两次 $90^\circ$ 等于转 $180^\circ$，也就是乘 $-1$，这正好对应 $i^2=-1$。

## 九、拓展：三维、非方阵，以及别处的矩阵

前面一直在二维里打转，但“列 = 基向量的像”这件事跟维数无关。

三维里，$3\times 3$ 矩阵的三列分别是 $\mathbf{e}_1$、$\mathbf{e}_2$、$\mathbf{e}_3$ 的新位置；行列式是体积的缩放倍率。比如 $\operatorname{diag}(2,2,1)$ 把单位正方体变成 $2\times 2\times 1$ 的长方体，体积变成 $4$ 倍，$\det=4$；投影 $\operatorname{diag}(1,1,0)$ 把空间压到 $xy$ 平面，$\det=0$；绕 $z$ 轴旋转的矩阵 $\det=1$，体积不变。四维、五维……想象起来越来越困难，但规则没有变：看基向量去哪，看行列式（高维体积）缩放了多少，看哪些方向被压没了。

非方阵则描述了“不同维数空间之间”的映射。$m\times n$ 矩阵是 $\mathbb{R}^n\to\mathbb{R}^m$ 的线性映射：

- $2\times 3$ 矩阵 $\begin{pmatrix}1&0&0\\0&1&0\end{pmatrix}$ 把三维空间压到二维平面（扔掉 $z$ 坐标），秩为 $2$，零空间是 $z$ 轴；
- $3\times 2$ 矩阵 $\begin{pmatrix}1&0\\0&1\\0&0\end{pmatrix}$ 把二维平面嵌进三维空间（$xy$ 平面），秩也为 $2$。

非方阵没有行列式，也不能像方阵那样“一来一回都不损失”（可能有单侧逆，这里不展开）；秩最多是 $\min(m,n)$。这也符合直觉：从低维到高维，满秩时可以“嵌入”；从高维到低维，必然有方向被“丢失”。只有方阵且满秩时，才可能一来一回都不损失。

“矩阵是变换”这个视角也不只属于数学课。把一张 $m\times n$ 的表格看成一个矩阵，它的每一列可以看成一种“特征”；图像是像素矩阵；图的邻接矩阵记录连接关系；神经网络里的一层，做的是 $W\mathbf{x}+\mathbf{b}$ 这样的仿射变换——线性部分 $W$ 再加上一个平移 $\mathbf{b}$，外面再套一个非线性激活函数。在这些场景里，矩阵既是“数据表”，也是“操作符”——两种看法并不矛盾：数表是存储方式，变换是它的含义。

甚至线性方程组也可以放回这个框架：$A\mathbf{x}=\mathbf{b}$ 是在问“哪个 $\mathbf{x}$ 被 $A$ 送到 $\mathbf{b}$”；有解当且仅当 $\mathbf{b}$ 在 $A$ 的列空间里。学的时候觉得“列空间”“零空间”“秩”这些词很抽象，画成图之后，它们其实都在描述同一件事：这个变换把空间变成了什么样。同一个空间上的变换换一组基，矩阵会变（新矩阵是 $A'=P^{-1}AP$，$P$ 的列是新基），但“秩、行列式、特征值”这些量不会变——这也是以后“相似矩阵”要讲的事。

## 十、写在最后：我目前的答案

如果现在让我用一句话回答开头的问题，我会说：

> 矩阵是线性变换在选定基下的一份“坐标记录”。它的列告诉你基向量被送到了哪里；它的乘法对应变换的复合；它的行列式告诉你空间被放大或压缩了多少；它的逆告诉你能否倒回去；它的秩告诉你还剩下几维；它的特征向量告诉你哪些方向没有变。

“数表”是它的外表，“变换”是它的内容。两种说法都对，只是一开始我只看到了外表。

当然，我还有很多没想明白的地方。比如行列式按 Leibniz 公式展开为什么长那样、相似矩阵和特征值更深的意义、奇异值分解到底在做什么、复数特征值的几何图像……这些可能要等学得更深再回来补。但至少现在，看到矩阵时，我脑子里浮现的不再只是一个方块，而是一张会动、会拉伸、会折叠的网格。

最后，如果你也在学线性代数，强烈推荐配合 3Blue1Brown 的《线性代数的本质》一起看；自己动手画几个 $2\times 2$ 矩阵作用在网格上的效果，比背十遍公式都管用。下面是我常用的两个交互网页，可以拖着玩：

- [线性代数可视化（novasolver）](https://novasolver.jp/zh/tools/linear-algebra-vis.html)
- [另一个线性变换可视化](https://xuzhang258097-glitch.github.io/linear-algebra-viz/#playground)

也可以试试用几行 Python 验证今天的内容：

```python
import numpy as np

H = np.array([[1, 1], [0, 1]])
R = np.array([[0, -1], [1, 0]])

x = np.array([3, 2])
print(H @ x)             # [5 2]
print(R @ (H @ x))       # [-2  5]
print((R @ H) @ x)       # [-2  5]
print((H @ R) @ x)       # [1 3]
print(np.linalg.det(H))  # 1.0
```

如果这篇文章里有什么错误，或者你有更直观的解释，欢迎在评论区告诉我。毕竟，这篇笔记本身也还在“变换”中。

## 参考资料与延伸阅读

- [3Blue1Brown：线性代数的本质（播放列表）](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab)
- [3Blue1Brown 官网：Linear algebra](https://www.3blue1brown.com/topics/linear-algebra)
- [线性代数可视化（novasolver）](https://novasolver.jp/zh/tools/linear-algebra-vis.html)
- [线性变换可视化 playground](https://xuzhang258097-glitch.github.io/linear-algebra-viz/#playground)

<script loading="lazy"
        src="https://giscus.app/client.js"
        data-repo="mobellling/mobellling.github.io"
        data-repo-id="R_kgDOVU1Z4g"
        data-category="Announcements"
        data-category-id="DIC_kwDOVU1Z4s4DJfbN"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="cobalt"
        data-lang="zh-CN"
        crossorigin="anonymous"
        async>
</script>
