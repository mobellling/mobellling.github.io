#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Deterministic figure generator for the comprehensive linear-algebra notes.

Run from the repository root:
    D:\\APP\\Conda\\python.exe scripts\\linear-algebra-figures.py

Staging (QA without touching public/ or src/):
    D:\\APP\\Conda\\python.exe scripts\\linear-algebra-figures.py --out-root .tmp\\la-staging

Style follows scripts/matrix-figures.py (same paper palette, same helpers) so
the new figures sit next to the older matrix article without visual clash.
No LaTeX is used: math is matplotlib mathtext, Chinese text is Microsoft YaHei.
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import to_rgba
from matplotlib.patches import FancyArrowPatch, Polygon, Rectangle, Arc
from PIL import Image

# --------------------------------------------------------------------------
# Global style (identical palette to matrix-figures.py)
# --------------------------------------------------------------------------
PAPER = "#FBFAF7"
GRID = "#D8D4CA"
GRID_DARK = "#BDB7A9"
AXIS = "#A8A296"
INK = "#2B2B2B"
ORANGE = "#D95F02"
BLUE = "#1F6FEB"
TEAL = "#2A9D8F"
GHOST = "#9AA0A6"
RED = "#C0392B"
GRAY = "#6B7280"
NAVY = "#0B1220"
NAVY_GRID = "#17233B"

plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "DejaVu Sans"]
plt.rcParams["font.family"] = "sans-serif"
plt.rcParams["axes.unicode_minus"] = False
plt.rcParams["mathtext.fontset"] = "dejavusans"
plt.rcParams["figure.facecolor"] = PAPER
plt.rcParams["axes.facecolor"] = PAPER
plt.rcParams["savefig.facecolor"] = PAPER
plt.rcParams["savefig.edgecolor"] = PAPER
plt.rcParams["figure.max_open_warning"] = 0

I = np.eye(2)
H = np.array([[1.0, 1.0], [0.0, 1.0]])
T3 = np.array([[2.0, 1.0], [0.0, 1.5]])        # det = 3
P = np.array([[1.0, 0.0], [0.0, 0.0]])
M = np.array([[2.0, 1.0], [1.0, 2.0]])          # eigenvalues 3, 1
UNIT = np.array([[0.0, 1.0, 1.0, 0.0], [0.0, 0.0, 1.0, 1.0]])


def _rgba(color: str, alpha: float):
    return to_rgba(color, alpha)


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
def _draw_grid(ax, color=GRID, lw=0.8, ls="-", alpha=1.0, zorder=0):
    xmin, xmax = ax.get_xlim()
    ymin, ymax = ax.get_ylim()
    for k in range(math.ceil(xmin), math.floor(xmax) + 1):
        ax.plot([k, k], [ymin, ymax], color=color, lw=lw, ls=ls,
                alpha=alpha, zorder=zorder, solid_capstyle="butt")
    for k in range(math.ceil(ymin), math.floor(ymax) + 1):
        ax.plot([xmin, xmax], [k, k], color=color, lw=lw, ls=ls,
                alpha=alpha, zorder=zorder, solid_capstyle="butt")


def _draw_axes(ax):
    xmin, xmax = ax.get_xlim()
    ymin, ymax = ax.get_ylim()
    xr, yr = xmax - xmin, ymax - ymin
    common = dict(arrowstyle="-|>", mutation_scale=11, lw=1.1, color=AXIS,
                  shrinkA=0, shrinkB=0, zorder=2, clip_on=False)
    ax.add_patch(FancyArrowPatch((xmin + 0.015 * xr, 0.0),
                                 (xmax - 0.012 * xr, 0.0), **common))
    ax.add_patch(FancyArrowPatch((0.0, ymin + 0.015 * yr),
                                 (0.0, ymax - 0.012 * yr), **common))


def _panel(ax, xlim, ylim, title=None, title_size=16, title_pad=8,
           grid=True, grid_kw=None, axis=True):
    ax.set_facecolor(PAPER)
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.set_aspect("equal", adjustable="box")
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)
    if grid:
        _draw_grid(ax, **(grid_kw or {}))
    if axis:
        _draw_axes(ax)
    if title:
        ax.set_title(title, fontsize=title_size, color=INK, pad=title_pad)


def _canvas(ax, xlim, ylim):
    """Schematic canvas: no aspect lock, no axes, no grid."""
    ax.set_facecolor(PAPER)
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)


def _arrow(ax, start, end, color, lw=2.2, ms=14, ls="-", zorder=7, alpha=1.0):
    patch = FancyArrowPatch(
        start, end, arrowstyle="-|>", mutation_scale=ms, lw=lw,
        color=color, shrinkA=0, shrinkB=0, zorder=zorder, clip_on=False,
        linestyle=ls, alpha=alpha, joinstyle="miter", capstyle="butt",
    )
    ax.add_patch(patch)
    return patch


def _ghost_segment(ax, start, end, color=GHOST, lw=1.45, alpha=0.8, zorder=3):
    ax.plot([start[0], end[0]], [start[1], end[1]], color=color, lw=lw,
            ls=(0, (4.0, 4.0)), alpha=alpha, zorder=zorder,
            dash_capstyle="butt")


def _label(ax, x, y, text, color=INK, fs=13.5, ha="center", va="center",
           rotate=0.0, box=True, zorder=12, alpha=1.0):
    kw = dict(fontsize=fs, color=color, ha=ha, va=va, rotation=rotate,
              zorder=zorder, alpha=alpha, clip_on=False)
    if box:
        kw["bbox"] = dict(boxstyle="round,pad=0.16", facecolor=PAPER,
                          edgecolor="none", alpha=0.90)
    return ax.text(x, y, text, **kw)


def _dot(ax, point, color=INK, size=42, zorder=9):
    ax.scatter([point[0]], [point[1]], s=size, color=color, zorder=zorder,
               edgecolors="none")


def _polygon(ax, points, fill=True, face_alpha=0.20, edge_alpha=0.90,
             lw=1.6, zorder=4, color=TEAL):
    pts = np.asarray(points, float).T
    patch = Polygon(
        pts, closed=True,
        facecolor=_rgba(color, face_alpha) if fill else "none",
        edgecolor=_rgba(color, edge_alpha), lw=lw, zorder=zorder,
        joinstyle="miter",
    )
    ax.add_patch(patch)
    return patch


def _transformed_grid(ax, matrix, kmin=-6, kmax=6, span=7.0, color=GRID_DARK,
                      lw=0.9, alpha=1.0, zorder=1, ls="-"):
    s = np.array([-span, span], float)
    for k in range(kmin, kmax + 1):
        pts = matrix @ np.vstack([np.full(2, float(k)), s])
        ax.plot(pts[0], pts[1], color=color, lw=lw, alpha=alpha,
                zorder=zorder, linestyle=ls, solid_capstyle="butt")
        pts = matrix @ np.vstack([s, np.full(2, float(k))])
        ax.plot(pts[0], pts[1], color=color, lw=lw, alpha=alpha,
                zorder=zorder, linestyle=ls, solid_capstyle="butt")


def _ghost_unit_square(ax, matrix=None, zorder=3):
    pts = (UNIT if matrix is None else matrix @ UNIT).T
    ax.add_patch(Polygon(pts, closed=True, fill=False, edgecolor=GHOST,
                         lw=1.15, ls=(0, (4.0, 4.0)), alpha=0.85,
                         zorder=zorder))


def _cells(ax, x0, y0, rows, cols, cw, ch, labels=None, fill="none",
           edge=GRID_DARK, lw=1.3, fs=12.5, color=INK, marks=None,
           mark_alpha=0.22, zorder=4):
    """Draw a rows x cols array of cells.  (i, j) is (row, col), row 0 on top."""
    for i in range(rows):
        for j in range(cols):
            x = x0 + j * cw
            y = y0 + (rows - 1 - i) * ch
            face = fill
            ec = edge
            lw_ = lw
            if marks and (i, j) in marks:
                face = _rgba(marks[(i, j)], mark_alpha)
                ec = marks[(i, j)]
                lw_ = 1.9
            ax.add_patch(Rectangle((x, y), cw, ch, facecolor=face,
                                   edgecolor=ec, lw=lw_, zorder=zorder))
            if labels is not None:
                ax.text(x + cw / 2, y + ch / 2, labels[i][j], ha="center",
                        va="center", fontsize=fs, color=color, zorder=zorder + 1)


def _brackets(ax, x0, y0, w, h, color=INK, lw=2.0, arm=0.32, zorder=6):
    """Square brackets around a block."""
    for sx in (x0, x0 + w):
        ax.plot([sx, sx], [y0, y0 + h], color=color, lw=lw, zorder=zorder,
                solid_capstyle="round")
    for sx, d in ((x0, 1), (x0 + w, -1)):
        ax.plot([sx, sx + d * arm], [y0, y0], color=color, lw=lw,
                zorder=zorder, solid_capstyle="round")
        ax.plot([sx, sx + d * arm], [y0 + h, y0 + h], color=color, lw=lw,
                zorder=zorder, solid_capstyle="round")


def _p3(x, y, z):
    """Oblique (cabinet) projection of a 3D point into 2D."""
    return np.array([x + 0.52 * y, z + 0.36 * y], float)


# --------------------------------------------------------------------------
# Saving
# --------------------------------------------------------------------------
def _normalise_png(path: Path, target_width=1600, limit_kb=420):
    with Image.open(path) as im:
        im = im.convert("RGB")
        if im.width != target_width:
            height = int(round(im.height * target_width / im.width))
            im = im.resize((target_width, height), Image.Resampling.LANCZOS)
        im.save(path, "PNG", optimize=True, dpi=(160, 160))
    if path.stat().st_size > limit_kb * 1024:
        with Image.open(path) as im:
            base = im.convert("RGB")
        for colors in (160, 128, 96, 64):
            q = base.quantize(colors=colors, method=Image.MEDIANCUT,
                              dither=Image.NONE)
            q.save(path, "PNG", optimize=True, dpi=(160, 160))
            if path.stat().st_size <= limit_kb * 1024:
                break


def _save_figure(fig, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=160, facecolor=PAPER, edgecolor=PAPER,
                bbox_inches="tight", pad_inches=0.18)
    plt.close(fig)
    _normalise_png(path)


# --------------------------------------------------------------------------
# Fig 1: scalar / vector / matrix / tensor
# --------------------------------------------------------------------------
def make_fig01(path: Path):
    fig, axes = plt.subplots(1, 4, figsize=(11, 4.4),
                             gridspec_kw={"width_ratios": [1.0, 1.0, 1.15, 1.25]})
    fig.subplots_adjust(left=0.02, right=0.98, bottom=0.14, top=0.80,
                        wspace=0.10)
    titles = ["标量（0 维）", "向量（1 维）", "矩阵（2 维）",
              "张量（" + r"$\geq 3$" + " 维）"]
    notes = ["单个数值", "有序的一列数", "$m\\times n$ 个元素", "更高维的数组"]

    # scalar
    ax = axes[0]
    _canvas(ax, (0, 10), (0, 10))
    ax.add_patch(Rectangle((3.1, 4.1), 3.8, 2.6, facecolor=_rgba(BLUE, 0.12),
                           edgecolor=BLUE, lw=1.8, zorder=4))
    ax.text(5.0, 5.4, r"$3.14$", ha="center", va="center", fontsize=19,
            color=INK, zorder=5)

    # vector
    ax = axes[1]
    _canvas(ax, (0, 10), (0, 10))
    cw, ch = 3.2, 1.55
    x0, y0 = 3.4, 2.6
    _cells(ax, x0, y0, 4, 1, cw, ch,
           [[r"$x_1$"], [r"$x_2$"], [r"$\vdots$"], [r"$x_n$"]],
           fs=13.5, color=INK)
    _brackets(ax, x0, y0, cw, 4 * ch)
    ax.text(x0 + cw / 2, y0 - 0.85, r"$\mathbf{x}\in\mathbb{R}^{n}$",
            ha="center", va="center", fontsize=13, color=GRAY)

    # matrix
    ax = axes[2]
    _canvas(ax, (0, 11), (0, 10))
    cw2, ch2 = 1.9, 1.55
    x0, y0 = 2.6, 2.6
    _cells(ax, x0, y0, 3, 3, cw2, ch2, fs=12.5)
    _brackets(ax, x0, y0, 3 * cw2, 3 * ch2)
    ax.text(x0 + 3 * cw2 / 2, y0 - 0.85, r"$\mathbf{A}\in\mathbb{R}^{m\times n}$",
            ha="center", va="center", fontsize=13, color=GRAY)
    # row / column markers
    ax.annotate("", xy=(x0 - 0.15, y0 + 2 * ch2 + ch2 / 2),
                xytext=(x0 - 1.25, y0 + 2 * ch2 + ch2 / 2),
                arrowprops=dict(arrowstyle="-|>", color=ORANGE, lw=1.5,
                                mutation_scale=10))
    ax.text(x0 - 1.35, y0 + 2 * ch2 + ch2 / 2, r"$A_{1,:}$", ha="right",
            va="center", fontsize=11.5, color=ORANGE)
    ax.annotate("", xy=(x0 + 2 * cw2 + cw2 / 2, y0 + 3 * ch2 + 0.15),
                xytext=(x0 + 2 * cw2 + cw2 / 2, y0 + 3 * ch2 + 1.15),
                arrowprops=dict(arrowstyle="-|>", color=TEAL, lw=1.5,
                                mutation_scale=10))
    ax.text(x0 + 2 * cw2 + cw2 / 2, y0 + 3 * ch2 + 1.28, r"$A_{:,3}$",
            ha="center", va="bottom", fontsize=11.5, color=TEAL)

    # tensor
    ax = axes[3]
    _canvas(ax, (0, 12), (0, 10))
    cw3, ch3 = 1.25, 1.05
    base_x, base_y = 3.4, 2.0
    for k, (dx, dy, alpha, ec) in enumerate(
            [(1.5, 1.5, 0.28, GHOST), (0.75, 0.75, 0.55, GRAY), (0.0, 0.0, 1.0, TEAL)]):
        _cells(ax, base_x + dx, base_y + dy, 3, 3, cw3, ch3, fs=0,
               fill=_rgba(TEAL, 0.06), edge=_rgba(ec, alpha if k < 2 else 0.95),
               lw=1.1, zorder=3 + k)
    ax.text(base_x + 1.5 * cw3, base_y - 0.85,
            r"$\mathcal{X}\in\mathbb{R}^{n_1\times n_2\times n_3}$",
            ha="center", va="center", fontsize=12.5, color=GRAY)

    for ax, t, n in zip(axes, titles, notes):
        ax.set_title(t, fontsize=14, color=INK, pad=16)
        ax.text(0.5, 1.0, n, transform=ax.transAxes, ha="center", va="bottom",
                fontsize=11, color=GRAY)

    fig.text(0.5, 0.025, "维数 = 索引的个数：一个下标是向量，两个下标是矩阵，三个下标就是三阶张量",
             ha="center", va="center", fontsize=12.5, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 2: transpose
# --------------------------------------------------------------------------
def make_fig02(path: Path):
    fig, ax = plt.subplots(figsize=(10, 5.4))
    fig.subplots_adjust(left=0.02, right=0.98, bottom=0.08, top=0.90)
    _canvas(ax, (0, 20), (0, 11))

    cw, ch = 2.0, 1.75
    ax0, ay0 = 1.6, 2.4
    ax1, ay1 = 12.4, 2.4
    labs = [[r"$a_{11}$", r"$a_{12}$", r"$a_{13}$"],
            [r"$a_{21}$", r"$a_{22}$", r"$a_{23}$"],
            [r"$a_{31}$", r"$a_{32}$", r"$a_{33}$"]]
    trans = [[labs[j][i] for j in range(3)] for i in range(3)]

    diag = {(0, 0): TEAL, (1, 1): TEAL, (2, 2): TEAL}
    _cells(ax, ax0, ay0, 3, 3, cw, ch, labs, fill=PAPER, marks=diag,
           mark_alpha=0.16, fs=13.5)
    _brackets(ax, ax0, ay0, 3 * cw, 3 * ch)
    _cells(ax, ax1, ay1, 3, 3, cw, ch, trans, fill=PAPER,
           marks={(0, 1): ORANGE, (1, 0): ORANGE}, mark_alpha=0.18, fs=13.5)
    _brackets(ax, ax1, ay1, 3 * cw, 3 * ch)

    # main diagonal line
    ax.plot([ax0 - 0.1, ax0 + 3 * cw + 0.1], [ay0 + 3 * ch + 0.1, ay0 - 0.1],
            color=TEAL, lw=1.5, ls=(0, (5, 4)), zorder=3, alpha=0.9)
    ax.plot([ax1 - 0.1, ax1 + 3 * cw + 0.1], [ay1 + 3 * ch + 0.1, ay1 - 0.1],
            color=TEAL, lw=1.5, ls=(0, (5, 4)), zorder=3, alpha=0.9)

    _label(ax, ax0 + 3 * cw / 2, ay0 + 3 * ch + 0.75, r"$\mathbf{A}$",
           INK, fs=17)
    _label(ax, ax1 + 3 * cw / 2, ay1 + 3 * ch + 0.75, r"$\mathbf{A}^{T}$",
           INK, fs=17)
    ax.plot([ax0 - 0.05, ax0 + 0.7], [1.35, 1.35], color=TEAL, lw=1.6,
            ls=(0, (5, 4)), zorder=6)
    _label(ax, ax0 + 0.8, 1.35, "主对角线：元素原地不动", TEAL, fs=11,
           ha="left")

    # middle arrow
    ax.add_patch(FancyArrowPatch((8.1, 5.4), (11.6, 5.4), arrowstyle="-|>",
                                 mutation_scale=22, lw=2.4, color=INK,
                                 shrinkA=0, shrinkB=0, zorder=9))
    _label(ax, 9.85, 6.05, "以主对角线为轴翻转", INK, fs=12)

    # a_12 -> a_21 callout
    ax.annotate("", xy=(ax1 + cw / 2, ay1 + 1.5 * ch),
                xytext=(ax0 + 1.5 * cw, ay0 + 1.5 * ch),
                arrowprops=dict(arrowstyle="-|>", color=ORANGE, lw=1.6,
                                mutation_scale=11,
                                connectionstyle="arc3,rad=-0.28"))
    _label(ax, (ax0 + ax1) / 2 + 0.6, 9.55,
           r"$(A^{T})_{ij}=A_{ji}$", ORANGE, fs=14)

    fig.text(0.5, 0.035,
             "第 $i$ 行第 $j$ 列的元素，转置后搬到第 $j$ 行第 $i$ 列；对角线上的元素原地不动",
             ha="center", va="center", fontsize=12.5, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 3: matrix multiplication, row x column and column combination
# --------------------------------------------------------------------------
def make_fig03(path: Path):
    fig = plt.figure(figsize=(11, 5.6))
    gs = fig.add_gridspec(1, 2, left=0.02, right=0.98, bottom=0.10, top=0.88,
                          width_ratios=[1.25, 1.0], wspace=0.12)

    # ---- left: the shapes
    ax = fig.add_subplot(gs[0, 0])
    _canvas(ax, (0, 22), (0, 13))
    ax.set_title("形状要对得上：内维必须相等", fontsize=14.5, color=INK, pad=12)

    cw, ch = 1.35, 1.15
    # A: 2x3
    _cells(ax, 0.9, 7.0, 2, 3, cw, ch, marks={(0, j): ORANGE for j in range(3)},
           mark_alpha=0.20, fs=0)
    _brackets(ax, 0.9, 7.0, 3 * cw, 2 * ch, lw=1.7, arm=0.22)
    ax.text(0.9 + 1.5 * cw, 6.2, r"$\mathbf{A}$", ha="center", va="center",
            fontsize=16, color=INK)
    ax.text(0.9 + 1.5 * cw, 5.35, r"$m\times n$", ha="center", va="center",
            fontsize=12, color=GRAY)
    ax.text(0.9 + 1.5 * cw, 10.15, "第 1 行", ha="center", va="center",
            fontsize=11, color=ORANGE)

    ax.text(5.55, 8.2, r"$\times$", ha="center", va="center", fontsize=20,
            color=GRAY)

    # B: 3x2
    _cells(ax, 7.1, 5.2, 3, 2, cw, ch, marks={(i, 0): BLUE for i in range(3)},
           mark_alpha=0.20, fs=0)
    _brackets(ax, 7.1, 5.2, 2 * cw, 3 * ch, lw=1.7, arm=0.22)
    ax.text(7.1 + cw, 4.4, r"$\mathbf{B}$", ha="center", va="center",
            fontsize=16, color=INK)
    ax.text(7.1 + cw, 3.55, r"$n\times p$", ha="center", va="center",
            fontsize=12, color=GRAY)
    ax.text(7.1 + cw, 9.35, "第 1 列", ha="center", va="center", fontsize=11,
            color=BLUE)

    ax.text(11.6, 8.2, r"$=$", ha="center", va="center", fontsize=20,
            color=GRAY)

    # C: 2x2
    _cells(ax, 13.1, 7.0, 2, 2, cw, ch, marks={(0, 0): TEAL}, mark_alpha=0.22,
           fs=0)
    _brackets(ax, 13.1, 7.0, 2 * cw, 2 * ch, lw=1.7, arm=0.22)
    ax.text(13.1 + cw, 6.2, r"$\mathbf{C}=\mathbf{AB}$", ha="center",
            va="center", fontsize=15, color=INK)
    ax.text(13.1 + cw, 5.35, r"$m\times p$", ha="center", va="center",
            fontsize=12, color=GRAY)

    ax.text(7.9, 2.55, r"结果取外维：$m\times p$",
            ha="center", va="center", fontsize=12, color=INK)

    # ---- right: one entry
    ax = fig.add_subplot(gs[0, 1])
    _canvas(ax, (0, 14), (0, 13))
    ax.set_title(r"$C_{ij}$ = 第 $i$ 行 · 第 $j$ 列", fontsize=14.5,
                 color=INK, pad=12)

    cw2, ch2 = 1.5, 1.35
    # row vector (row i of A)
    _cells(ax, 0.55, 6.65, 1, 3, cw2, ch2,
           [[r"$a_{i1}$", r"$a_{i2}$", r"$a_{i3}$"]],
           marks={(0, 0): ORANGE, (0, 1): ORANGE, (0, 2): ORANGE},
           mark_alpha=0.16, fs=12.5)
    _brackets(ax, 0.55, 6.65, 3 * cw2, ch2, lw=1.6, arm=0.22)
    ax.text(0.55 + 1.5 * cw2, 5.75, r"$\mathbf{A}$ 的第 $i$ 行",
            ha="center", va="center", fontsize=11, color=ORANGE)

    # column vector (column j of B)
    _cells(ax, 6.45, 5.30, 3, 1, cw2, ch2,
           [[r"$b_{1j}$"], [r"$b_{2j}$"], [r"$b_{3j}$"]],
           marks={(0, 0): BLUE, (1, 0): BLUE, (2, 0): BLUE},
           mark_alpha=0.16, fs=12.5)
    _brackets(ax, 6.45, 5.30, cw2, 3 * ch2, lw=1.6, arm=0.22)
    ax.text(6.45 + cw2 / 2, 10.3, r"$\mathbf{B}$ 的第 $j$ 列",
            ha="center", va="center", fontsize=11, color=BLUE)

    ax.text(5.55, 7.32, r"$\cdot$", ha="center", va="center", fontsize=20,
            color=GRAY)
    ax.text(8.65, 7.32, r"$=$", ha="center", va="center", fontsize=18,
            color=GRAY)
    ax.add_patch(Rectangle((9.45, 6.30), 2.7, 2.05, facecolor=_rgba(TEAL, 0.18),
                           edgecolor=TEAL, lw=1.9, zorder=5))
    ax.text(10.80, 7.32, r"$C_{ij}$", ha="center", va="center", fontsize=15,
            color=INK, zorder=6)

    ax.text(6.6, 3.45, r"$C_{ij}=\sum_{k=1}^{n}A_{ik}B_{kj}"
                       r"=a_{i1}b_{1j}+a_{i2}b_{2j}+a_{i3}b_{3j}$",
            ha="center", va="center", fontsize=13.5, color=INK)
    ax.text(6.6, 2.35, "先乘后加：对应位置相乘，再把 $n$ 个乘积加起来",
            ha="center", va="center", fontsize=11.5, color=GRAY)

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 4: span
# --------------------------------------------------------------------------
def make_fig04(path: Path):
    fig, axes = plt.subplots(1, 2, figsize=(10, 5.2))
    fig.subplots_adjust(left=0.035, right=0.965, bottom=0.06, top=0.865,
                        wspace=0.12)
    lim = (-3.2, 3.2)

    ax = axes[0]
    _panel(ax, lim, lim, title=r"$\mathrm{Span}\{\mathbf{v}\}$ 是一条直线",
           title_size=14.5)
    t = np.linspace(-3.4, 3.4, 2)
    v = np.array([1.25, 0.85])
    ax.plot(v[0] * t, v[1] * t, color=_rgba(TEAL, 0.55), lw=6.5, zorder=2,
            solid_capstyle="round", alpha=0.28)
    _arrow(ax, (0, 0), tuple(v), ORANGE, lw=2.4, ms=15)
    _label(ax, v[0] + 0.18, v[1] + 0.30, r"$\mathbf{v}$", ORANGE, fs=15)
    _label(ax, -2.05, -1.65, r"$\{c\mathbf{v}\mid c\in\mathbb{R}\}$", TEAL,
           fs=12.5, ha="left")

    ax = axes[1]
    _panel(ax, lim, lim, title=r"$\mathrm{Span}\{\mathbf{a},\mathbf{b}\}$ 是整个平面",
           title_size=14.5, grid_kw={"alpha": 0.55})
    ax.add_patch(Rectangle((lim[0], lim[0]), lim[1] - lim[0], lim[1] - lim[0],
                           facecolor=_rgba(TEAL, 0.10), edgecolor="none",
                           zorder=0.5))
    a = np.array([1.85, -0.55])
    b = np.array([0.55, 1.55])
    _arrow(ax, (0, 0), tuple(a), ORANGE, lw=2.4, ms=15)
    _arrow(ax, (0, 0), tuple(b), BLUE, lw=2.4, ms=15)
    _label(ax, a[0] + 0.12, a[1] - 0.30, r"$\mathbf{a}$", ORANGE, fs=15)
    _label(ax, b[0] - 0.30, b[1] + 0.14, r"$\mathbf{b}$", BLUE, fs=15)
    _label(ax, -2.0, -2.35, r"$c_1\mathbf{a}+c_2\mathbf{b}$ 铺满 $\mathbb{R}^{2}$",
           TEAL, fs=12.5, ha="left")

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 5: linear dependence in 3D (oblique projection)
# --------------------------------------------------------------------------
def make_fig05(path: Path):
    fig, axes = plt.subplots(1, 2, figsize=(10, 5.4))
    fig.subplots_adjust(left=0.02, right=0.98, bottom=0.10, top=0.86,
                        wspace=0.04)

    lim = (-1.35, 4.45)
    ylim = (-1.5, 4.0)

    def frame(ax, title):
        ax.set_facecolor(PAPER)
        ax.set_xlim(*lim)
        ax.set_ylim(*ylim)
        ax.set_aspect("equal", adjustable="box")
        ax.set_xticks([])
        ax.set_yticks([])
        for spine in ax.spines.values():
            spine.set_visible(False)
        ax.set_title(title, fontsize=14, color=INK, pad=10)
        # coordinate triad
        o = _p3(0, 0, 0)
        for end, lab in [(_p3(3.3, 0, 0), "$x$"), (_p3(0, 3.3, 0), "$y$"),
                         (_p3(0, 0, 3.3), "$z$")]:
            _ghost_segment(ax, o, end, AXIS, lw=1.1, alpha=0.7)
        ax.text(*_p3(3.4, 0, 0), "x", fontsize=11, color=GRAY, ha="left",
                va="center")
        ax.text(*_p3(0, 3.45, 0), "y", fontsize=11, color=GRAY, ha="left",
                va="center")
        ax.text(*_p3(0, 0, 3.45), "z", fontsize=11, color=GRAY, ha="center",
                va="bottom")

    a = np.array([2.5, 0.0, 0.0])
    b = np.array([0.0, 2.5, 0.0])
    o = np.zeros(3)

    # --- left: three coplanar vectors
    ax = axes[0]
    frame(ax, "共面：线性相关")
    plane = np.array([o, a, a + b, b])
    ax.add_patch(Polygon([_p3(*p) for p in plane], closed=True,
                         facecolor=_rgba(TEAL, 0.12),
                         edgecolor=_rgba(TEAL, 0.40), lw=1.0, zorder=1))
    cvec = 0.44 * a + 0.54 * b
    for vec, col, lab, off in [(a, ORANGE, r"$\mathbf{a}$", (0.12, -0.30)),
                               (b, BLUE, r"$\mathbf{b}$", (-0.34, 0.10)),
                               (cvec, RED, r"$\mathbf{c}$", (0.30, -0.26))]:
        _arrow(ax, tuple(_p3(*o)), tuple(_p3(*vec)), col, lw=2.3, ms=13)
        p = _p3(*vec)
        _label(ax, p[0] + off[0], p[1] + off[1], lab, col, fs=13.5)
    _label(ax, 2.15, -1.05, r"$\mathbf{c}=0.44\mathbf{a}+0.54\mathbf{b}$",
           RED, fs=12)

    # --- right: three vectors spanning 3D
    ax = axes[1]
    frame(ax, "不共面：线性无关")
    c = np.array([0.0, 0.0, 2.3])
    corners = [o, a, b, c, a + b, a + c, b + c, a + b + c]
    edges = [(0, 1), (0, 2), (0, 3), (1, 4), (2, 4), (1, 5), (3, 5),
             (2, 6), (3, 6), (4, 7), (5, 7), (6, 7)]
    for i, j in edges:
        _ghost_segment(ax, _p3(*corners[i]), _p3(*corners[j]), GHOST, lw=1.0,
                       alpha=0.55)
    for vec, col, lab, off in [(a, ORANGE, r"$\mathbf{a}$", (0.12, -0.30)),
                               (b, BLUE, r"$\mathbf{b}$", (-0.34, 0.10)),
                               (c, TEAL, r"$\mathbf{c}$", (0.06, 0.22))]:
        _arrow(ax, tuple(_p3(*o)), tuple(_p3(*vec)), col, lw=2.3, ms=13)
        p = _p3(*vec)
        _label(ax, p[0] + off[0], p[1] + off[1], lab, col, fs=13.5)
    _label(ax, 2.35, -1.05,
           r"$c_1\mathbf{a}+c_2\mathbf{b}+c_3\mathbf{c}=\mathbf{0}$ 只有零解",
           TEAL, fs=11.5)

    fig.text(0.5, 0.028,
             "三个向量张成的空间：落在同一平面内就退化成二维，此时必有一个能由另外两个拼出来",
             ha="center", va="center", fontsize=12.5, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 6: norm unit balls
# --------------------------------------------------------------------------
def make_fig06(path: Path):
    fig, axes = plt.subplots(1, 3, figsize=(10.5, 4.2))
    fig.subplots_adjust(left=0.03, right=0.97, bottom=0.16, top=0.84,
                        wspace=0.10)
    lim = (-1.55, 1.55)

    # L1 diamond
    ax = axes[0]
    _panel(ax, lim, lim, title=r"$\ell_1$ 范数（曼哈顿）", title_size=13.5)
    d = np.array([[0, 1], [1, 0], [0, -1], [-1, 0]])
    ax.add_patch(Polygon(d, closed=True, facecolor=_rgba(TEAL, 0.18),
                         edgecolor=TEAL, lw=2.2, zorder=4))
    _label(ax, 0.0, -1.28, r"$|x|+|y|=1$", TEAL, fs=12)

    # L2 circle
    ax = axes[1]
    _panel(ax, lim, lim, title=r"$\ell_2$ 范数（欧氏）", title_size=13.5)
    ax.add_patch(plt.Circle((0, 0), 1.0, facecolor=_rgba(TEAL, 0.18),
                            edgecolor=TEAL, lw=2.2, zorder=4))
    _label(ax, 0.0, -1.28, r"$x^2+y^2=1$", TEAL, fs=12)

    # Linf square
    ax = axes[2]
    _panel(ax, lim, lim, title=r"$\ell_\infty$ 范数（切比雪夫）", title_size=13.5)
    ax.add_patch(Rectangle((-1, -1), 2, 2, facecolor=_rgba(TEAL, 0.18),
                           edgecolor=TEAL, lw=2.2, zorder=4))
    _label(ax, 0.0, -1.28, r"$\max(|x|,|y|)=1$", TEAL, fs=12)

    fig.text(0.5, 0.032,
             "三种范数下“到原点距离恰好为 1”的点集：形状不同，是因为“距离”的定义不同",
             ha="center", va="center", fontsize=12.5, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 7: orthogonal projection
# --------------------------------------------------------------------------
def make_fig07(path: Path):
    fig, ax = plt.subplots(figsize=(10, 5.0))
    fig.subplots_adjust(left=0.03, right=0.97, bottom=0.06, top=0.88)
    _panel(ax, (-0.6, 6.6), (-0.9, 3.7), title="把向量拆成“沿 $a$ 的分量”与“垂直分量”",
           title_size=14.5, grid=False)

    a = np.array([5.4, 0.0])
    b = np.array([3.0, 2.7])
    foot = np.array([3.0, 0.0])

    ax.plot([-0.4, 6.4], [0, 0], color=_rgba(TEAL, 0.45), lw=7, alpha=0.22,
            zorder=1, solid_capstyle="round")
    _arrow(ax, (0, 0), tuple(a), TEAL, lw=2.2, ms=14)
    _arrow(ax, (0, 0), tuple(b), INK, lw=2.4, ms=15)
    _arrow(ax, (0, 0), tuple(foot), ORANGE, lw=3.0, ms=15, zorder=8)
    _ghost_segment(ax, tuple(b), tuple(foot), RED, lw=2.0, alpha=0.95, zorder=7)
    _arrow(ax, tuple(foot), tuple(b), RED, lw=1.8, ms=12, zorder=7)

    _label(ax, 5.6, 0.26, r"$\mathbf{a}$", TEAL, fs=15, ha="left")
    _label(ax, 2.72, 2.95, r"$\mathbf{b}$", INK, fs=15, ha="right")
    _label(ax, 1.55, -0.48, r"$\mathbf{p}=\mathrm{proj}_{\mathbf{a}}\mathbf{b}$",
           ORANGE, fs=13)
    _label(ax, 3.22, 1.42, r"$\mathbf{e}=\mathbf{b}-\mathbf{p}$", RED, fs=13,
           ha="left")

    # right angle mark at the foot
    s = 0.26
    ax.plot([foot[0] - s, foot[0] - s, foot[0]], [0, s, s], color=RED, lw=1.4,
            zorder=9)
    # theta arc
    ax.add_patch(Arc((0, 0), 1.5, 1.5, theta1=0, theta2=41.5, color=GRAY,
                     lw=1.3, zorder=9))
    _label(ax, 0.86, 0.34, r"$\theta$", GRAY, fs=13, box=False)

    ax.text(0.035, 0.975,
            r"$\mathbf{p}=\dfrac{\mathbf{a}^{T}\mathbf{b}}{\mathbf{a}^{T}\mathbf{a}}\,\mathbf{a}$"
            r"$,\qquad \mathbf{a}^{T}\mathbf{e}=0$",
            transform=ax.transAxes, ha="left", va="top", fontsize=14,
            color=INK,
            bbox=dict(boxstyle="round,pad=0.30", facecolor=PAPER,
                      edgecolor="none", alpha=0.96))
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 8: eigenvectors keep direction
# --------------------------------------------------------------------------
def make_fig08(path: Path):
    lim = (-3.6, 4.6)
    fig, axes = plt.subplots(1, 2, figsize=(10, 5.2))
    fig.subplots_adjust(left=0.035, right=0.965, bottom=0.06, top=0.87,
                        wspace=0.12)

    v1 = np.array([1.0, 1.0])
    v2 = np.array([1.0, -1.0])
    w = np.array([2.1, 0.0])

    ax = axes[0]
    _panel(ax, lim, lim, title="原来的网格", title_size=14.5)
    _arrow(ax, (0, 0), tuple(v1), ORANGE, lw=2.2, ms=13)
    _arrow(ax, (0, 0), tuple(v2), BLUE, lw=2.2, ms=13)
    _arrow(ax, (0, 0), tuple(w), GRAY, lw=2.0, ms=12)
    _label(ax, 1.16, 1.30, r"$\mathbf{v}_1$", ORANGE, fs=13.5)
    _label(ax, 1.20, -1.34, r"$\mathbf{v}_2$", BLUE, fs=13.5)
    _label(ax, 2.22, 0.26, r"$\mathbf{w}$", GRAY, fs=13.5, ha="left")

    ax = axes[1]
    _panel(ax, lim, lim, title=r"经过 $M$ 之后：只有特征方向不变", title_size=14.5,
           grid=False)
    _transformed_grid(ax, M, kmin=-4, kmax=4, span=8.0)
    _ghost_segment(ax, (0, 0), tuple(w), GHOST, lw=1.3, alpha=0.85)
    _arrow(ax, (0, 0), tuple(3 * v1), ORANGE, lw=2.2, ms=13)
    _arrow(ax, (0, 0), tuple(1 * v2), BLUE, lw=2.2, ms=13)
    _arrow(ax, (0, 0), tuple(M @ w), GRAY, lw=2.0, ms=12)
    _label(ax, 3.16, 3.34, r"$M\mathbf{v}_1=3\mathbf{v}_1$", ORANGE, fs=12.5,
           ha="left")
    _label(ax, 1.22, -1.34, r"$M\mathbf{v}_2=\mathbf{v}_2$", BLUE, fs=12.5,
           ha="left")
    _label(ax, 4.28, 1.28, r"$M\mathbf{w}$", GRAY, fs=12.5, ha="left")

    fig.text(0.5, 0.025,
             "橙色、蓝色两个方向只被拉长或压缩，没有拐弯 —— 它们就是特征向量；灰色方向被拧走了",
             ha="center", va="center", fontsize=12, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 9: SVD as rotate - stretch - rotate
# --------------------------------------------------------------------------
def make_fig09(path: Path):
    theta = np.deg2rad(35.0)
    phi = np.deg2rad(12.0)
    Vt = np.array([[np.cos(theta), np.sin(theta)], [-np.sin(theta), np.cos(theta)]])
    Sig = np.diag([2.35, 1.05])
    U = np.array([[np.cos(phi), -np.sin(phi)], [np.sin(phi), np.cos(phi)]])

    stages = [np.eye(2), Vt, Sig @ Vt, U @ Sig @ Vt]
    titles = ["原空间：单位圆", r"① $\mathbf{V}^{T}$ 旋转", r"② $\boldsymbol{\Sigma}$ 拉伸",
              r"③ $\mathbf{U}$ 再旋转"]
    lim = (-3.0, 3.0)
    tt = np.linspace(0, 2 * np.pi, 300)
    circle = np.vstack([np.cos(tt), np.sin(tt)])

    fig, axes = plt.subplots(1, 4, figsize=(11.5, 3.9))
    fig.subplots_adjust(left=0.02, right=0.98, bottom=0.10, top=0.845,
                        wspace=0.10)

    for ax, mat, title in zip(axes, stages, titles):
        _panel(ax, lim, lim, title=title, title_size=13, grid=False, axis=False)
        ax.plot([lim[0], lim[1]], [0, 0], color=AXIS, lw=0.9, alpha=0.5, zorder=0)
        ax.plot([0, 0], [lim[0], lim[1]], color=AXIS, lw=0.9, alpha=0.5, zorder=0)
        pts = mat @ circle
        ax.plot(pts[0], pts[1], color=_rgba(TEAL, 0.95), lw=2.4, zorder=5)
        ax.fill(pts[0], pts[1], color=_rgba(TEAL, 0.12), zorder=4)
        e1 = mat @ np.array([1.0, 0.0])
        e2 = mat @ np.array([0.0, 1.0])
        _arrow(ax, (0, 0), tuple(e1), ORANGE, lw=1.9, ms=11, zorder=6)
        _arrow(ax, (0, 0), tuple(e2), BLUE, lw=1.9, ms=11, zorder=6)

    _label(axes[0], 0.62, -0.30, r"$\mathbf{v}_1$", ORANGE, fs=11.5)
    _label(axes[0], -0.34, 0.55, r"$\mathbf{v}_2$", BLUE, fs=11.5)
    _label(axes[1], 0.05, -0.42, r"$\mathbf{v}_1$", ORANGE, fs=11.5)
    _label(axes[1], -0.55, 0.30, r"$\mathbf{v}_2$", BLUE, fs=11.5)
    _label(axes[2], 1.42, -0.32, r"$\sigma_1\mathbf{v}_1$", ORANGE, fs=11)
    _label(axes[2], -0.30, 0.62, r"$\sigma_2\mathbf{v}_2$", BLUE, fs=11)
    _label(axes[3], 1.28, -0.55, r"$\sigma_1\mathbf{u}_1$", ORANGE, fs=11)
    _label(axes[3], -0.72, 0.32, r"$\sigma_2\mathbf{u}_2$", BLUE, fs=11)

    # arrows between stages
    for i in range(3):
        x1 = axes[i].get_position().x1
        x2 = axes[i + 1].get_position().x0
        y = (axes[i].get_position().y0 + axes[i].get_position().y1) / 2
        fig.add_artist(FancyArrowPatch((x1 + 0.002, y), (x2 - 0.002, y),
                                       transform=fig.transFigure,
                                       arrowstyle="-|>", mutation_scale=12,
                                       lw=1.4, color=INK))

    fig.text(0.5, 0.028,
             r"$\mathbf{A}=\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^{T}$：圆先转正、再按奇异值拉伸成椭圆、最后整体转向",
             ha="center", va="center", fontsize=12.5, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 10: four fundamental subspaces
# --------------------------------------------------------------------------
def make_fig10(path: Path):
    fig, ax = plt.subplots(figsize=(10, 5.6))
    fig.subplots_adjust(left=0.02, right=0.98, bottom=0.10, top=0.90)
    _canvas(ax, (0, 20), (0, 12))

    def block(x, y, w, h, label, sub, color):
        ax.add_patch(Rectangle((x, y), w, h, facecolor=_rgba(color, 0.13),
                               edgecolor=_rgba(color, 0.85), lw=1.6,
                               zorder=4))
        ax.text(x + w / 2, y + h / 2 + 0.34, label, ha="center", va="center",
                fontsize=13.5, color=INK, zorder=5)
        ax.text(x + w / 2, y + h / 2 - 0.42, sub, ha="center", va="center",
                fontsize=11.5, color=color, zorder=5)

    # outer domains
    ax.add_patch(Rectangle((0.6, 0.9), 7.0, 10.0, facecolor="none",
                           edgecolor=GRID_DARK, lw=1.2, ls=(0, (6, 5)),
                           zorder=1))
    ax.add_patch(Rectangle((12.4, 0.9), 7.0, 10.0, facecolor="none",
                           edgecolor=GRID_DARK, lw=1.2, ls=(0, (6, 5)),
                           zorder=1))
    ax.text(4.1, 11.3, r"输入空间 $\mathbb{R}^{n}$", ha="center", va="center",
            fontsize=13, color=GRAY)
    ax.text(15.9, 11.3, r"输出空间 $\mathbb{R}^{m}$", ha="center", va="center",
            fontsize=13, color=GRAY)

    block(1.2, 6.4, 5.8, 2.6, r"行空间 $C(\mathbf{A}^{T})$", r"$\dim = r$", BLUE)
    block(1.2, 1.6, 5.8, 2.6, r"零空间 $N(\mathbf{A})$", r"$\dim = n-r$", RED)
    block(13.0, 6.4, 5.8, 2.6, r"列空间 $C(\mathbf{A})$", r"$\dim = r$", TEAL)
    block(13.0, 1.6, 5.8, 2.6, r"左零空间 $N(\mathbf{A}^{T})$", r"$\dim = m-r$",
          ORANGE)

    # arrows
    ax.add_patch(FancyArrowPatch((7.1, 7.7), (12.9, 7.7), arrowstyle="-|>",
                                 mutation_scale=16, lw=1.9, color=INK,
                                 shrinkA=0, shrinkB=0, zorder=6,
                                 connectionstyle="arc3,rad=-0.18"))
    ax.text(10.0, 9.05, r"$\mathbf{A}$：一一对应（同构）", ha="center",
            va="center", fontsize=12, color=INK)
    ax.add_patch(FancyArrowPatch((7.1, 2.9), (9.6, 2.9), arrowstyle="-|>",
                                 mutation_scale=14, lw=1.6, color=RED,
                                 shrinkA=0, shrinkB=0, zorder=6))
    ax.text(10.15, 2.9, r"$\mathbf{A}\mathbf{x}=\mathbf{0}$", ha="left",
            va="center", fontsize=12, color=RED)

    # orthogonality annotations
    ax.annotate("", xy=(1.2, 4.35), xytext=(1.2, 6.25),
                arrowprops=dict(arrowstyle="<|-|>", color=GRAY, lw=1.2,
                                mutation_scale=9))
    ax.text(0.45, 5.3, "正交", ha="center", va="center", fontsize=11,
            color=GRAY, rotation=90)
    ax.annotate("", xy=(12.6, 4.35), xytext=(12.6, 6.25),
                arrowprops=dict(arrowstyle="<|-|>", color=GRAY, lw=1.2,
                                mutation_scale=9))
    ax.text(11.85, 5.3, "正交", ha="center", va="center", fontsize=11,
            color=GRAY, rotation=90)

    fig.text(0.5, 0.032,
             r"秩–零化度定理：$r+(n-r)=n$，$r+(m-r)=m$；两个箭头都只由 $\mathbf{A}$ 决定",
             ha="center", va="center", fontsize=12.5, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 11: determinant as area scaling
# --------------------------------------------------------------------------
def make_fig11(path: Path):
    lim = (-1.2, 3.4)
    fig, axes = plt.subplots(1, 3, figsize=(10.2, 4.3))
    fig.subplots_adjust(left=0.035, right=0.965, bottom=0.14, top=0.845,
                        wspace=0.14)
    specs = [
        (r"剪切：$\det\mathbf{A}=1$，面积不变", H, "poly", 1.0),
        (r"拉伸：$\det\mathbf{A}=3$，面积 ×3", T3, "poly", 3.0),
        (r"投影：$\det\mathbf{A}=0$，面积归零", P, "seg", 0.0),
    ]
    for ax, (title, matrix, kind, area) in zip(axes, specs):
        _panel(ax, lim, lim, title=title, title_size=12.5, grid=False)
        _transformed_grid(ax, matrix, kmin=-2, kmax=3, span=5.0, color=GRID,
                          lw=0.7, alpha=0.75, zorder=0)
        _ghost_unit_square(ax, zorder=5)
        if kind == "poly":
            _polygon(ax, matrix @ UNIT, face_alpha=0.22, zorder=4)
            _arrow(ax, (0, 0), tuple(matrix @ np.array([1.0, 0.0])), ORANGE,
                   lw=2.0, ms=12, zorder=6)
            _arrow(ax, (0, 0), tuple(matrix @ np.array([0.0, 1.0])), BLUE,
                   lw=2.0, ms=12, zorder=6)
        else:
            ax.plot([0, 1], [0, 0], color=TEAL, lw=6.0,
                    solid_capstyle="round", zorder=6)
            _arrow(ax, (0, 0), (1, 0), ORANGE, lw=2.0, ms=12, zorder=7)
            _dot(ax, (0, 0), BLUE, 34, zorder=8)

    fig.text(0.5, 0.028,
             r"$\det\mathbf{A}$ 就是线性变换对“体积”的放大倍数；$\det = 0$ 意味着空间被压扁，变换不可逆",
             ha="center", va="center", fontsize=12.5, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 12: quadratic forms
# --------------------------------------------------------------------------
def make_fig12(path: Path):
    fig, axes = plt.subplots(1, 3, figsize=(10.5, 4.0))
    fig.subplots_adjust(left=0.03, right=0.97, bottom=0.16, top=0.845,
                        wspace=0.10)
    lim = (-2.2, 2.2)
    xs = np.linspace(*lim, 400)
    X, Y = np.meshgrid(xs, xs)

    specs = [
        (np.array([[1.0, 0.0], [0.0, 2.5]]),
         "正定（" + r"$\mathbf{A}\succ 0$" + "）\n等高线：椭圆", TEAL),
        (np.array([[1.0, 0.0], [0.0, -1.0]]),
         "不定（一正一负）\n等高线：双曲线", ORANGE),
        (np.array([[1.0, 0.0], [0.0, 0.0]]),
         "半正定（" + r"$\det\mathbf{A}=0$" + "）\n等高线：平行直线", GRAY),
    ]
    levels = [-1.0, 1.0, 2.5, 5.0]
    for ax, (A, title, color) in zip(axes, specs):
        _panel(ax, lim, lim, title=title, title_size=12.5, grid=False,
               title_pad=6)
        Z = A[0, 0] * X ** 2 + 2 * A[0, 1] * X * Y + A[1, 1] * Y ** 2
        ax.contour(X, Y, Z, levels=levels, colors=[color], linewidths=1.5,
                   zorder=4)
        ax.contourf(X, Y, Z, levels=[-1e9, 0], colors=[_rgba(color, 0.07)],
                    zorder=1)

    fig.text(0.5, 0.028,
             r"$q(\mathbf{x})=\mathbf{x}^{T}\mathbf{A}\mathbf{x}$ 的等值线形状，由 $\mathbf{A}$ 的特征值符号决定",
             ha="center", va="center", fontsize=12.5, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 13: least squares
# --------------------------------------------------------------------------
def make_fig13(path: Path):
    fig, axes = plt.subplots(1, 2, figsize=(10.4, 4.5))
    fig.subplots_adjust(left=0.04, right=0.96, bottom=0.11, top=0.855,
                        wspace=0.16)

    xd = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
    yd = np.array([1.4, 2.2, 2.6, 3.9, 4.1, 5.2])
    A = np.vstack([xd, np.ones_like(xd)]).T
    coef, *_ = np.linalg.lstsq(A, yd, rcond=None)
    fit = A @ coef

    ax = axes[0]
    _panel(ax, (0.2, 6.8), (0.4, 6.0), title="数据点与最小二乘直线",
           title_size=13.5, grid=False)
    _draw_grid(ax, color=GRID, lw=0.7, alpha=0.7, zorder=0)
    for xi, yi, fi in zip(xd, yd, fit):
        ax.plot([xi, xi], [fi, yi], color=RED, lw=1.6, ls=(0, (3, 3)),
                zorder=3, alpha=0.9)
    ax.plot(xd, fit, color=TEAL, lw=2.6, zorder=5)
    ax.scatter(xd, yd, s=46, color=INK, zorder=6, edgecolors=PAPER,
               linewidths=1.2)
    _label(ax, 6.15, float(fit[-1]) + 0.55, r"$\hat{\mathbf{y}}$", TEAL, fs=13,
           ha="right")
    k = int(np.argmax(np.abs(yd - fit)))
    ax.annotate("残差", xy=(xd[k] + 0.06, (yd[k] + fit[k]) / 2),
                xytext=(1.05, 5.25), fontsize=11.5, color=RED,
                ha="left", va="center",
                arrowprops=dict(arrowstyle="-|>", color=RED, lw=1.1,
                                shrinkA=3, shrinkB=3, mutation_scale=9,
                                connectionstyle="arc3,rad=-0.16"))

    ax = axes[1]
    _panel(ax, (-0.4, 6.4), (-0.5, 4.6), title="几何上：把 $b$ 投影到列空间",
           title_size=13.5, grid=False)
    b = np.array([5.0, 3.4])
    p = np.array([5.0, 0.0])
    ax.plot([-0.2, 6.2], [0, 0], color=_rgba(TEAL, 0.5), lw=8, alpha=0.25,
            zorder=1, solid_capstyle="round")
    _arrow(ax, (0, 0), tuple(b), INK, lw=2.2, ms=13)
    _arrow(ax, (0, 0), tuple(p), ORANGE, lw=2.8, ms=13, zorder=8)
    _arrow(ax, tuple(p), tuple(b), RED, lw=1.8, ms=12, zorder=7)
    _label(ax, 4.72, 3.62, r"$\mathbf{b}$", INK, fs=14, ha="right")
    _label(ax, 2.4, -0.34, r"$\mathbf{A}\hat{\mathbf{x}}$", ORANGE, fs=13)
    _label(ax, 5.22, 1.65, r"$\mathbf{e}$", RED, fs=13, ha="left")
    s = 0.24
    ax.plot([p[0] - s, p[0] - s, p[0]], [0, s, s], color=RED, lw=1.3, zorder=9)
    ax.text(0.02, 0.97, r"$\mathbf{A}^{T}(\mathbf{b}-\mathbf{A}\hat{\mathbf{x}})=\mathbf{0}$",
            transform=ax.transAxes, ha="left", va="top", fontsize=13,
            color=INK,
            bbox=dict(boxstyle="round,pad=0.28", facecolor=PAPER,
                      edgecolor="none", alpha=0.96))

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 14: Gram-Schmidt
# --------------------------------------------------------------------------
def make_fig14(path: Path):
    fig = plt.figure(figsize=(11, 5.0))
    gs = fig.add_gridspec(1, 2, left=0.02, right=0.98, bottom=0.10, top=0.88,
                          width_ratios=[1.15, 1.0], wspace=0.10)

    ax = fig.add_subplot(gs[0, 0])
    _panel(ax, (-1.0, 7.4), (-2.2, 5.8),
           title=r"几何意义：先减去 $\mathbf{v}_2$ 在 $\mathbf{u}_1$ 上的投影",
           title_size=13.5, title_pad=12)

    v1 = np.array([4.6, 1.0])
    v2 = np.array([2.2, 4.4])
    proj = float(v2 @ v1) / float(v1 @ v1) * v1
    e = v2 - proj

    _arrow(ax, (0, 0), tuple(v1), BLUE, lw=2.4, ms=14)
    _arrow(ax, (0, 0), tuple(proj), ORANGE, lw=3.0, ms=14, zorder=9)
    _arrow(ax, (0, 0), tuple(v2), INK, lw=2.0, ms=13)
    _arrow(ax, tuple(proj), tuple(v2), RED, lw=2.0, ms=13, zorder=8)
    _ghost_segment(ax, (0, 0), tuple(v2))

    n1 = v1 / np.linalg.norm(v1)
    ne = e / np.linalg.norm(e)
    s = 0.32
    a1 = proj + s * n1
    a2 = proj + s * ne
    corner = a1 + s * ne
    ax.plot([a1[0], corner[0], a2[0]], [a1[1], corner[1], a2[1]],
            color=RED, lw=1.3, zorder=10)

    _label(ax, 4.75, 1.35, r"$\mathbf{u}_1=\mathbf{v}_1$", BLUE, fs=13,
           ha="left")
    _label(ax, 2.45, 4.55, r"$\mathbf{v}_2$", INK, fs=13, ha="left")
    _label(ax, 1.55, 2.95, r"$\mathbf{e}=\mathbf{v}_2-\mathbf{p}$", RED,
           fs=12.5, ha="right")
    _label(ax, 0.55, -1.55,
           r"$\mathbf{p}=\frac{\mathbf{v}_2^{T}\mathbf{u}_1}"
           r"{\mathbf{u}_1^{T}\mathbf{u}_1}\mathbf{u}_1$", ORANGE, fs=13)
    _label(ax, 4.75, -1.55, r"$\mathbf{v}_2=\mathbf{p}+\mathbf{e}$", INK,
           fs=12.5, ha="left")

    ax = fig.add_subplot(gs[0, 1])
    _canvas(ax, (0, 10), (0, 10))
    ax.set_title("正交化 + 单位化：把任意基变成标准正交基", fontsize=13.5,
                 color=INK, pad=12)
    steps = [
        (9.2, r"① 取 $\mathbf{u}_1=\mathbf{v}_1$", 13.5, INK),
        (7.5, r"② $\mathbf{u}_2=\mathbf{v}_2-\frac{\mathbf{v}_2^{T}\mathbf{u}_1}"
              r"{\mathbf{u}_1^{T}\mathbf{u}_1}\mathbf{u}_1$", 13.5, INK),
        (5.4, r"③ $\mathbf{u}_3=\mathbf{v}_3-\frac{\mathbf{v}_3^{T}\mathbf{u}_1}"
              r"{\mathbf{u}_1^{T}\mathbf{u}_1}\mathbf{u}_1"
              r"-\frac{\mathbf{v}_3^{T}\mathbf{u}_2}"
              r"{\mathbf{u}_2^{T}\mathbf{u}_2}\mathbf{u}_2$", 13.0, INK),
        (3.3, r"④ $\mathbf{e}_k=\frac{\mathbf{u}_k}{\|\mathbf{u}_k\|_2}$",
         13.5, INK),
    ]
    for y, txt, fs, col in steps:
        ax.text(0.45, y, txt, fontsize=fs, color=col, ha="left", va="center")
    ax.text(0.45, 1.6,
            r"$\mathbf{u}_i^{T}\mathbf{u}_j=0\ (i\neq j)$，"
            r"$\|\mathbf{e}_k\|_2=1$",
            fontsize=13, color=TEAL, ha="left", va="center")

    fig.text(0.5, 0.02,
             "每一步都减去在所有已正交方向上的投影；剩下的部分与前面全部正交",
             ha="center", va="center", fontsize=12.5, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 15: change of basis
# --------------------------------------------------------------------------
def make_fig15(path: Path):
    fig = plt.figure(figsize=(11, 4.9))
    gs = fig.add_gridspec(1, 2, left=0.03, right=0.97, bottom=0.10, top=0.88,
                          wspace=0.07)

    b1 = np.array([1.3, 0.5])
    b2 = np.array([-0.4, 1.0])
    c = np.array([1.6, 1.1])
    x = c[0] * b1 + c[1] * b2

    # ---- left: standard basis
    ax = fig.add_subplot(gs[0, 0])
    _panel(ax, (-1.2, 5.0), (-1.4, 4.2),
           title=r"标准基 $\mathbf{e}_1,\mathbf{e}_2$：读横纵坐标",
           title_size=13.5, title_pad=12)
    _arrow(ax, (0, 0), (1.0, 0.0), AXIS, lw=1.6, ms=11, alpha=0.85)
    _arrow(ax, (0, 0), (0.0, 1.0), AXIS, lw=1.6, ms=11, alpha=0.85)
    _label(ax, 0.78, 0.3, r"$\mathbf{e}_1$", GRAY, fs=11.5, ha="left")
    _label(ax, -0.34, 0.72, r"$\mathbf{e}_2$", GRAY, fs=11.5, ha="right")
    _ghost_segment(ax, (0, 0), (x[0], 0))
    _ghost_segment(ax, (x[0], 0), tuple(x))
    _arrow(ax, (0, 0), tuple(x), INK, lw=2.3, ms=13)
    _label(ax, x[0], -0.42, r"$1.64$", GRAY, fs=11.5)
    _label(ax, -0.42, x[1], r"$1.90$", GRAY, fs=11.5, ha="right")
    _label(ax, x[0] + 0.2, x[1] + 0.38, r"$\mathbf{x}$", INK, fs=15,
           ha="left")
    ax.text(0.03, 0.95, r"$\mathbf{x}=(1.64,\ 1.90)^{T}$", transform=ax.transAxes,
            fontsize=12.5, color=INK, ha="left", va="top",
            bbox=dict(boxstyle="round,pad=0.26", facecolor=PAPER,
                      edgecolor="none", alpha=0.95))

    # ---- right: basis b1, b2 with the induced lattice
    ax = fig.add_subplot(gs[0, 1])
    _panel(ax, (-2.4, 4.6), (-1.4, 3.6),
           title=r"新基 $\mathbf{b}_1,\mathbf{b}_2$：同一网格里读坐标",
           title_size=13.5, title_pad=12, grid=False)
    for k in range(-6, 7):
        a = k * b1 - 6.0 * b2
        b = k * b1 + 6.0 * b2
        ax.plot([a[0], b[0]], [a[1], b[1]], color=GRID, lw=0.85, zorder=0,
                solid_capstyle="butt")
        a = k * b2 - 6.0 * b1
        b = k * b2 + 6.0 * b1
        ax.plot([a[0], b[0]], [a[1], b[1]], color=GRID, lw=0.85, zorder=0,
                solid_capstyle="butt")

    _arrow(ax, (0, 0), tuple(b1), ORANGE, lw=2.4, ms=13)
    _arrow(ax, (0, 0), tuple(b2), TEAL, lw=2.4, ms=13)
    ax.plot([0, c[0] * b1[0]], [0, c[0] * b1[1]], color=ORANGE, lw=1.8,
            ls=(0, (4.0, 3.0)), zorder=6)
    ax.plot([c[0] * b1[0], x[0]], [c[0] * b1[1], x[1]], color=TEAL,
            lw=1.8, ls=(0, (4.0, 3.0)), zorder=6)
    _arrow(ax, (0, 0), tuple(x), INK, lw=2.2, ms=13, zorder=7)

    _label(ax, 1.42, 0.18, r"$\mathbf{b}_1$", ORANGE, fs=13, ha="left",
           rotate=21.0)
    _label(ax, -0.62, 1.12, r"$\mathbf{b}_2$", TEAL, fs=13, ha="right",
           rotate=112.0)
    _label(ax, 2.25, 0.42, r"$c_1=1.6$", ORANGE, fs=11.5, ha="left")
    _label(ax, 2.12, 1.63, r"$c_2=1.1$", TEAL, fs=11.5, ha="left")
    _label(ax, x[0] + 0.2, x[1] + 0.38, r"$\mathbf{x}$", INK, fs=15,
           ha="left")
    ax.text(0.03, 0.95,
            r"$\mathbf{x}=\mathbf{P}\mathbf{c}$,  "
            r"$\mathbf{P}=[\mathbf{b}_1\ \mathbf{b}_2]$",
            transform=ax.transAxes, fontsize=13, color=INK, ha="left",
            va="top",
            bbox=dict(boxstyle="round,pad=0.26", facecolor=PAPER,
                      edgecolor="none", alpha=0.95))

    fig.text(0.5, 0.02,
             r"换基不改变向量本身：$\mathbf{x}=\mathbf{P}\mathbf{c}$，"
             r"$\mathbf{P}$ 的列就是新基在标准基下的坐标",
             ha="center", va="center", fontsize=12.5, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Fig 16: Jordan block and generalized eigenvector chain
# --------------------------------------------------------------------------
def make_fig16(path: Path):
    fig = plt.figure(figsize=(11, 4.9))
    gs = fig.add_gridspec(1, 2, left=0.03, right=0.97, bottom=0.10, top=0.88,
                          width_ratios=[1.0, 1.3], wspace=0.08)

    # ---- left: the block
    ax = fig.add_subplot(gs[0, 0])
    _canvas(ax, (0, 10), (0, 10))
    ax.set_title("Jordan 块：对角线是特征值，上对角线是 1", fontsize=13.5,
                 color=INK, pad=12)
    labs = [[r"$\lambda$", r"$1$", r"$0$"],
            [r"$0$", r"$\lambda$", r"$1$"],
            [r"$0$", r"$0$", r"$\lambda$"]]
    cw, ch = 1.9, 1.6
    x0, y0 = 2.2, 3.6
    marks = {(0, 0): BLUE, (1, 1): BLUE, (2, 2): BLUE,
             (0, 1): ORANGE, (1, 2): ORANGE}
    _cells(ax, x0, y0, 3, 3, cw, ch, labs, fill=PAPER, marks=marks,
           mark_alpha=0.18, fs=14)
    _brackets(ax, x0, y0, 3 * cw, 3 * ch)
    ax.text(x0 + 1.5 * cw, 2.55,
            r"$\mathbf{J}_3(\lambda)=\lambda\mathbf{E}_3+\mathbf{N}$",
            ha="center", va="center", fontsize=14, color=INK)
    ax.text(x0 + 1.5 * cw, 1.55,
            r"$\mathbf{N}^{3}=\mathbf{O}$；代数重数 3，几何重数 1",
            ha="center", va="center", fontsize=12, color=GRAY)
    ax.annotate(r"$\mathbf{N}$", xy=(x0 + 1.5 * cw, y0 + 2.5 * ch),
                xytext=(x0 + 3 * cw + 0.55, y0 + 2.5 * ch),
                fontsize=12.5, color=ORANGE, ha="left", va="center",
                arrowprops=dict(arrowstyle="-|>", color=ORANGE, lw=1.2,
                                shrinkA=2, shrinkB=2, mutation_scale=9))

    # ---- right: generalized eigenvector chain
    ax = fig.add_subplot(gs[0, 1])
    _canvas(ax, (0, 14), (0, 10))
    ax.set_title("广义特征向量链：每一步都被 $(\\mathbf{A}-\\lambda\\mathbf{E})$"
                 " 送到前一个", fontsize=13.5, color=INK, pad=12)
    nodes = [(2.6, 8.1), (2.6, 5.1), (2.6, 2.1)]
    for (px, py), txt in zip(nodes, [r"$\mathbf{v}_3$", r"$\mathbf{v}_2$",
                                     r"$\mathbf{v}_1$"]):
        _dot(ax, (px, py), color=_rgba(BLUE, 0.16), size=2600, zorder=5)
        ax.scatter([px], [py], s=2600, facecolors=_rgba(BLUE, 0.16),
                   edgecolors=BLUE, linewidths=1.6, zorder=5)
        _label(ax, px, py, txt, INK, fs=13, zorder=6)
    _dot(ax, (2.6, 0.3), color=_rgba(GRAY, 0.18), size=900, zorder=5)
    _label(ax, 2.6, 0.3, r"$\mathbf{0}$", GRAY, fs=13)
    _arrow(ax, (2.6, 7.45), (2.6, 5.75), BLUE, lw=1.8, ms=12)
    _arrow(ax, (2.6, 4.45), (2.6, 2.75), BLUE, lw=1.8, ms=12)
    _arrow(ax, (2.6, 1.5), (2.6, 0.75), RED, lw=1.6, ms=11)
    ax.text(5.0, 6.95, r"$(\mathbf{A}-\lambda\mathbf{E})\mathbf{v}_3"
            r"=\mathbf{v}_2$", fontsize=13, color=INK, ha="left",
            va="center")
    ax.text(5.0, 3.95, r"$(\mathbf{A}-\lambda\mathbf{E})\mathbf{v}_2"
            r"=\mathbf{v}_1$", fontsize=13, color=INK, ha="left",
            va="center")
    ax.text(5.0, 1.05, r"$(\mathbf{A}-\lambda\mathbf{E})\mathbf{v}_1"
            r"=\mathbf{0}$", fontsize=13, color=RED, ha="left",
            va="center")
    ax.text(0.04, 0.96, "链长 = 该 Jordan 块的阶数", transform=ax.transAxes,
            fontsize=12, color=GRAY, ha="left", va="top")

    fig.text(0.5, 0.02,
             r"不能对角化时，$\mathbf{A}$ 相似于 Jordan 形：上对角线的 1 "
             r"记录广义特征向量的层级",
             ha="center", va="center", fontsize=12.5, color=INK)
    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Cover
# --------------------------------------------------------------------------
def make_cover(path: Path):
    width, height = 1600, 900
    fig = plt.figure(figsize=(8, 4.5), dpi=200)
    fig.set_facecolor(NAVY)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor(NAVY)
    ax.set_xlim(-1.0, 1.0)
    ax.set_ylim(-0.5625, 0.5625)
    ax.set_aspect("equal", adjustable="box")
    ax.axis("off")

    for x in np.arange(-1.0, 1.0001, 0.125):
        ax.plot([x, x], [-0.5625, 0.5625], color=NAVY_GRID, lw=0.8, zorder=0,
                alpha=1.0, solid_capstyle="butt")
    for y in np.arange(-0.5, 0.5001, 0.125):
        ax.plot([-1.0, 1.0], [y, y], color=NAVY_GRID, lw=0.8, zorder=0,
                alpha=1.0, solid_capstyle="butt")

    # eigen / svd motif: a large rotated ellipse plus its principal axes
    th = np.deg2rad(26.0)
    t = np.linspace(0, 2 * np.pi, 480)

    # 变换前的单位圆：虚线，提示“圆被 A 拉成椭圆”
    circ = 0.30
    ax.plot(circ * np.cos(t), circ * np.sin(t), color=_rgba("#F4F1E8", 0.34),
            lw=1.6, ls=(0, (7, 5)), zorder=2)

    a_len, b_len = 0.78, 0.32
    ex, ey = a_len * np.cos(t), b_len * np.sin(t)
    Xr = ex * np.cos(th) - ey * np.sin(th)
    Yr = ex * np.sin(th) + ey * np.cos(th)
    for lw, al in ((26, 0.05), (16, 0.08), (8, 0.12)):
        ax.plot(Xr, Yr, color=_rgba(TEAL, al), lw=lw, zorder=1,
                solid_capstyle="round")
    ax.fill(Xr, Yr, color=_rgba(TEAL, 0.16), zorder=2)
    ax.plot(Xr, Yr, color=_rgba(TEAL, 0.95), lw=2.8, zorder=3)
    for ang, col, ln, lw in ((th, ORANGE, a_len, 4.6),
                             (th + np.pi / 2, BLUE, b_len, 4.2)):
        ax.add_patch(FancyArrowPatch((0, 0), (ln * np.cos(ang), ln * np.sin(ang)),
                                     arrowstyle="-|>", mutation_scale=26,
                                     lw=lw, color=col, shrinkA=0, shrinkB=0,
                                     zorder=5, clip_on=False, capstyle="round"))

    for scale, alpha in ((1.16, 0.10), (1.38, 0.06)):
        ax.plot(Xr * scale, Yr * scale, color=_rgba(TEAL, alpha), lw=1.4,
                zorder=2)
    ax.scatter([0], [0], s=42, color="#F4F1E8", zorder=6, edgecolors="none")

    tmp = Path(str(path) + ".raw.png")
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(tmp, dpi=200, facecolor=NAVY, edgecolor=NAVY)
    plt.close(fig)

    with Image.open(tmp) as im:
        art = im.convert("RGB")
    if art.size != (width, height):
        art = art.resize((width, height), Image.Resampling.LANCZOS)

    arr = np.asarray(art).astype(np.float32) / 255.0
    bg = np.array([0x0B, 0x12, 0x20], dtype=np.float32) / 255.0
    delta = np.clip(arr - bg, 0.0, 1.0)
    from PIL import ImageFilter
    for sigma, strength in ((24.0, 0.50), (6.0, 0.30)):
        blurred = Image.fromarray((delta * 255.0).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(sigma))
        b = np.asarray(blurred).astype(np.float32) / 255.0
        arr = 1.0 - (1.0 - arr) * (1.0 - strength * b)

    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    cx, cy = width * 0.5, height * 0.48
    r = np.sqrt(((xx - cx) / (width * 0.62)) ** 2 +
                ((yy - cy) / (height * 0.72)) ** 2)
    vig = 1.0 - 0.46 * np.clip((r - 0.34) / 0.95, 0.0, 1.0) ** 1.4
    arr *= vig[..., None]

    out = Image.fromarray(np.clip(arr * 255.0, 0, 255).astype(np.uint8))
    out.save(path, "PNG", optimize=True, compress_level=9)
    tmp.unlink(missing_ok=True)


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out-root", type=Path, default=None)
    parser.add_argument("--only", type=str, default=None,
                        help="comma separated figure ids, e.g. 3,7")
    args = parser.parse_args()

    repo = Path(__file__).resolve().parents[1]
    root = args.out_root.resolve() if args.out_root else repo
    img_dir = root / "public" / "images" / "blog" / "linear-algebra"
    cover_path = root / "src" / "assets" / "images" / "blog" / "linear-algebra-cover.png"
    img_dir.mkdir(parents=True, exist_ok=True)
    cover_path.parent.mkdir(parents=True, exist_ok=True)

    jobs = [
        ("fig01-objects.png", make_fig01),
        ("fig02-transpose.png", make_fig02),
        ("fig03-matmul.png", make_fig03),
        ("fig04-span.png", make_fig04),
        ("fig05-independent.png", make_fig05),
        ("fig06-norm.png", make_fig06),
        ("fig07-projection.png", make_fig07),
        ("fig08-eigen.png", make_fig08),
        ("fig09-svd.png", make_fig09),
        ("fig10-subspaces.png", make_fig10),
        ("fig11-det.png", make_fig11),
        ("fig12-quadform.png", make_fig12),
        ("fig13-lstsq.png", make_fig13),
        ("fig14-gram-schmidt.png", make_fig14),
        ("fig15-basis-change.png", make_fig15),
        ("fig16-jordan.png", make_fig16),
    ]
    only = {s.strip() for s in args.only.split(",")} if args.only else None
    for idx, (name, fn) in enumerate(jobs, start=1):
        if only and str(idx) not in only:
            continue
        fn(img_dir / name)
        print(f"  wrote {name}")

    if not only:
        make_cover(cover_path)
        print(f"  wrote {cover_path.name}")

    print("\nfile                              dimensions        size")
    print("-" * 60)
    for p in sorted(img_dir.glob("*.png")) + [cover_path]:
        with Image.open(p) as im:
            print(f"{p.name:32s} {im.width:4d} x {im.height:<5d} "
                  f"{p.stat().st_size / 1024.0:7.1f} KB")


if __name__ == "__main__":
    main()

