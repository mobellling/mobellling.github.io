#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Deterministic figure generator for the Chinese linear-algebra article.

Run from the repository root:
    D:\\APP\\Conda\\python.exe scripts\\matrix-figures.py

Optional staging (used for QA when the sandbox cannot write under public/ or src/):
    D:\\APP\\Conda\\python.exe scripts\\matrix-figures.py --out-root .tmp\\matrix-staging

Only matplotlib, numpy and Pillow are required.  No LaTeX is used: math is
rendered with matplotlib's DejaVu Sans mathtext, Chinese text with Microsoft
YaHei / SimHei.  The script is deterministic: there is no randomness and every
point is obtained by explicit numpy matrix multiplication.
"""

from __future__ import annotations

import argparse
import math
import tempfile
from pathlib import Path

import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import to_rgba
from matplotlib.patches import FancyArrowPatch, Polygon, Rectangle
from PIL import Image, ImageFilter

# --------------------------------------------------------------------------
# Global style
# --------------------------------------------------------------------------
PAPER = "#FBFAF7"
GRID = "#D8D4CA"
AXIS = "#A8A296"
INK = "#2B2B2B"
ORANGE = "#D95F02"
BLUE = "#1F6FEB"
TEAL = "#2A9D8F"
GHOST = "#9AA0A6"
RED = "#C0392B"
GRAY = "#6B7280"
GRID_DARK = "#BDB7A9"
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
H = np.array([[1.0, 1.0], [0.0, 1.0]])       # shear: e1 -> (1,0), e2 -> (1,1)
S = np.array([[2.0, 0.0], [0.0, 1.0]])       # stretch x2
R = np.array([[0.0, -1.0], [1.0, 0.0]])      # CCW 90 degrees
F = np.array([[1.0, 0.0], [0.0, -1.0]])      # reflection in x-axis
P = np.array([[1.0, 0.0], [0.0, 0.0]])       # projection onto x-axis
M = np.array([[2.0, 1.0], [1.0, 2.0]])       # eigen example
BA = R @ H
AB = H @ R

UNIT = np.array([[0.0, 1.0, 1.0, 0.0], [0.0, 0.0, 1.0, 1.0]])


# --------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------
def _rgba(color: str, alpha: float):
    return to_rgba(color, alpha)


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
    xr = xmax - xmin
    yr = ymax - ymin
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


def _arrow(ax, start, end, color, lw=2.2, ms=14, ls="-", zorder=7,
           alpha=1.0):
    patch = FancyArrowPatch(
        start, end, arrowstyle="-|>", mutation_scale=ms, lw=lw,
        color=color, shrinkA=0, shrinkB=0, zorder=zorder, clip_on=False,
        linestyle=ls, alpha=alpha, joinstyle="miter", capstyle="butt",
    )
    ax.add_patch(patch)
    return patch


def _ghost_segment(ax, start, end, color=GHOST, lw=1.45, alpha=0.8,
                   zorder=3):
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
             lw=1.6, zorder=4):
    pts = np.asarray(points, float).T
    patch = Polygon(
        pts, closed=True,
        facecolor=_rgba(TEAL, face_alpha) if fill else "none",
        edgecolor=_rgba(TEAL, edge_alpha), lw=lw, zorder=zorder,
        joinstyle="miter",
    )
    ax.add_patch(patch)
    return patch


def _transformed_grid(ax, matrix, kmin=-6, kmax=6, span=7.0,
                      color=GRID_DARK, lw=0.9, alpha=1.0, zorder=1,
                      ls="-"):
    s = np.array([-span, span], float)
    for k in range(kmin, kmax + 1):
        # vertical line x = k
        pts = matrix @ np.vstack([np.full(2, float(k)), s])
        ax.plot(pts[0], pts[1], color=color, lw=lw, alpha=alpha,
                zorder=zorder, linestyle=ls, solid_capstyle="butt")
        # horizontal line y = k
        pts = matrix @ np.vstack([s, np.full(2, float(k))])
        ax.plot(pts[0], pts[1], color=color, lw=lw, alpha=alpha,
                zorder=zorder, linestyle=ls, solid_capstyle="butt")


def _unit_square(matrix=None):
    return UNIT if matrix is None else matrix @ UNIT


def _ghost_unit_square(ax, matrix=None, zorder=3):
    pts = _unit_square(matrix).T
    ax.add_patch(Polygon(pts, closed=True, fill=False, edgecolor=GHOST,
                         lw=1.15, ls=(0, (4.0, 4.0)), alpha=0.85,
                         zorder=zorder))


# --------------------------------------------------------------------------
# Saving / size normalisation
# --------------------------------------------------------------------------
def _normalise_png(path: Path, target_width=1600, limit_kb=450):
    with Image.open(path) as im:
        im = im.convert("RGB")
        if im.width != target_width:
            height = int(round(im.height * target_width / im.width))
            im = im.resize((target_width, height), Image.Resampling.LANCZOS)
        im.save(path, "PNG", optimize=True, dpi=(160, 160))
    if path.stat().st_size > limit_kb * 1024:
        with Image.open(path) as im:
            base = im.convert("RGB")
        for colors in (128, 96, 64, 48):
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


def _shrink_gif(path: Path, limit_kb=900):
    if path.stat().st_size <= limit_kb * 1024:
        return
    with Image.open(path) as im:
        frames = []
        for idx in range(im.n_frames):
            im.seek(idx)
            frames.append(im.convert("RGB").quantize(
                colors=64, method=Image.MEDIANCUT, dither=Image.NONE))
        frames[0].save(path, save_all=True, append_images=frames[1:],
                       duration=56, loop=0, optimize=True, disposal=2)
    if path.stat().st_size > limit_kb * 1024:
        with Image.open(path) as im:
            frames = []
            for idx in range(im.n_frames):
                im.seek(idx)
                frames.append(im.convert("RGB").quantize(
                    colors=32, method=Image.MEDIANCUT, dither=Image.NONE))
            frames[0].save(path, save_all=True, append_images=frames[1:],
                           duration=56, loop=0, optimize=True, disposal=2)


# --------------------------------------------------------------------------
# Figure 1: a point as a coordinate combination
# --------------------------------------------------------------------------
def make_fig01(path: Path):
    fig, ax = plt.subplots(figsize=(10, 9.4))
    fig.subplots_adjust(left=0.045, right=0.955, bottom=0.045, top=0.925)
    _panel(ax, (-0.9, 4.4), (-0.9, 4.4),
           title="坐标 = 基向量的系数", title_size=16, title_pad=10)

    # basis vectors
    _arrow(ax, (0, 0), (1, 0), ORANGE)
    _arrow(ax, (0, 0), (0, 1), BLUE)
    _label(ax, 0.55, 0.26, r"$\mathbf{e}_1$", ORANGE, fs=15)
    _label(ax, -0.31, 0.55, r"$\mathbf{e}_2$", BLUE, fs=15)

    # decomposition 3 e1 + 2 e2
    _ghost_segment(ax, (0, 0), (3, 0), ORANGE, lw=1.6, alpha=0.95)
    _ghost_segment(ax, (3, 0), (3, 2), BLUE, lw=1.6, alpha=0.95)
    _label(ax, 1.50, -0.30, r"$3\mathbf{e}_1$", ORANGE, fs=13.5)
    _label(ax, 3.22, 1.00, r"$2\mathbf{e}_2$", BLUE, fs=13.5, ha="left")

    # the point
    _dot(ax, (3, 2), INK, 55)
    _label(ax, 3.16, 2.24, r"$(3,2)^T$", INK, fs=14, ha="left", va="bottom")

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Figure 2: shear keeps straight lines and parallels
# --------------------------------------------------------------------------
def make_fig02(path: Path):
    lim = (-2.9, 3.7)
    fig, axes = plt.subplots(1, 2, figsize=(10, 5.4))
    fig.subplots_adjust(left=0.045, right=0.955, bottom=0.045, top=0.895,
                        wspace=0.16)

    ax = axes[0]
    _panel(ax, lim, lim, title="原来的网格", title_size=16)
    _polygon(ax, _unit_square())
    _arrow(ax, (0, 0), (1, 0), ORANGE)
    _arrow(ax, (0, 0), (0, 1), BLUE)
    _label(ax, 0.48, -0.27, r"$\mathbf{e}_1$", ORANGE, fs=14)
    _label(ax, -0.30, 0.55, r"$\mathbf{e}_2$", BLUE, fs=14)

    ax = axes[1]
    _panel(ax, lim, lim, title=r"剪切之后（$H$）", title_size=16, grid=False)
    _transformed_grid(ax, H, kmin=-4, kmax=4, span=7.0)
    _polygon(ax, _unit_square(H))
    _arrow(ax, (0, 0), (1, 0), ORANGE)
    _arrow(ax, (0, 0), (1, 1), BLUE)
    # ghost of the original e2 (it lies on the y-axis, so tint it to read)
    _ghost_segment(ax, (0, 0), (0, 1), BLUE, lw=1.5, alpha=0.38)
    ax.scatter([0], [1], s=26, facecolors=PAPER, edgecolors=_rgba(BLUE, 0.45),
               linewidths=1.3, zorder=6)
    _label(ax, 0.52, -0.27, r"$\mathbf{e}_1$", ORANGE, fs=14)
    _label(ax, 1.18, 1.16, r"$\mathbf{e}_2$", BLUE, fs=14, ha="left")

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Figure 3: columns are the new basis vectors; Ax is a column combination
# --------------------------------------------------------------------------
def make_fig03(path: Path):
    xlim = (-1.3, 5.9)
    ylim = (-1.5, 3.9)
    fig, axes = plt.subplots(1, 2, figsize=(10, 4.7))
    fig.subplots_adjust(left=0.045, right=0.955, bottom=0.045, top=0.875,
                        wspace=0.16)

    ax = axes[0]
    _panel(ax, xlim, ylim, title="列 = 基向量的新位置", title_size=14.5)
    _ghost_segment(ax, (0, 0), (1, 0), ORANGE, lw=1.4, alpha=0.35)
    _ghost_segment(ax, (0, 0), (0, 1), BLUE, lw=1.5, alpha=0.38)
    ax.scatter([0], [1], s=26, facecolors=PAPER, edgecolors=_rgba(BLUE, 0.45),
               linewidths=1.3, zorder=6)
    _arrow(ax, (0, 0), (1, 0), ORANGE)
    _arrow(ax, (0, 0), (1, 1), BLUE)
    _label(ax, 0.55, -0.30, r"$\mathbf{e}_1$", ORANGE, fs=14)
    _label(ax, 1.16, 0.86, r"$\mathbf{e}_2$", BLUE, fs=14, ha="left")

    ax = axes[1]
    _panel(ax, xlim, ylim, title=r"用列拼出 $A\mathbf{x}$", title_size=15)
    # input coordinates
    _arrow(ax, (0, 0), (3, 2), GRAY, lw=1.6, ms=12, ls=(0, (4.0, 3.5)),
           zorder=5, alpha=0.9)
    _label(ax, 1.40, 0.76, r"$\mathbf{x}$", GRAY, fs=14)
    # column contributions
    _arrow(ax, (0, 0), (3, 0), ORANGE, zorder=6)
    _arrow(ax, (0, 0), (2, 2), BLUE, zorder=6)
    _ghost_segment(ax, (3, 0), (5, 2), GHOST, lw=1.2, alpha=0.9, zorder=4)
    _ghost_segment(ax, (2, 2), (5, 2), GHOST, lw=1.2, alpha=0.9, zorder=4)
    _label(ax, 1.50, -0.32, r"$3\cdot$列 1", ORANGE, fs=13)
    _label(ax, 1.02, 1.62, r"$2\cdot$列 2", BLUE, fs=13)
    _arrow(ax, (0, 0), (5, 2), INK, zorder=7)
    _label(ax, 5.15, 1.66, r"$A\mathbf{x}$", INK, fs=14, ha="left")

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Figure 4: the zoo of linear maps
# --------------------------------------------------------------------------
def make_fig04(path: Path):
    lim = (-3.9, 3.9)
    panels = [
        ("恒等", I, "identity"),
        ("拉伸 ×2", S, "normal"),
        ("剪切", H, "normal"),
        ("旋转 90°", R, "normal"),
        ("反射", F, "normal"),
        ("投影", P, "projection"),
    ]
    fig, axes = plt.subplots(2, 3, figsize=(10, 7.5))
    fig.subplots_adjust(left=0.04, right=0.96, bottom=0.055, top=0.91,
                        wspace=0.18, hspace=0.36)
    for ax, (title, matrix, kind) in zip(axes.ravel(), panels):
        _panel(ax, lim, lim, title=title, title_size=13.5, title_pad=7,
               grid=False)
        if kind == "projection":
            # all horizontal lines collapse onto the axis
            ax.plot([lim[0], lim[1]], [0, 0], color=GRID_DARK, lw=2.4,
                    zorder=1, solid_capstyle="butt")
            # all vertical lines collapse to points on the axis
            ks = np.arange(math.ceil(lim[0]), math.floor(lim[1]) + 1)
            ax.scatter(ks, np.zeros_like(ks), s=16, color=GRID_DARK,
                       zorder=2, edgecolors="none")
            # the unit square collapses to a segment
            ax.plot([0, 1], [0, 0], color=TEAL, lw=5.0, solid_capstyle="round",
                    zorder=5)
            _arrow(ax, (0, 0), (1, 0), ORANGE, lw=2.2, ms=14, zorder=6)
            _dot(ax, (0, 0), BLUE, 34, zorder=7)
            _label(ax, 0.26, 0.55, r"$\mathbf{e}_2\to 0$", BLUE, fs=11.5,
                   ha="left")
        else:
            if kind != "identity":
                _draw_grid(ax, color=GRID, lw=0.8, ls=(0, (1.5, 2.8)),
                           alpha=0.60, zorder=0)
            _transformed_grid(ax, matrix, kmin=-5, kmax=5, span=8.0,
                              color=GRID_DARK, lw=1.0, zorder=1)
            _polygon(ax, _unit_square(matrix))
            _arrow(ax, (0, 0), matrix @ np.array([1.0, 0.0]), ORANGE,
                   lw=2.2, ms=14, zorder=6)
            _arrow(ax, (0, 0), matrix @ np.array([0.0, 1.0]), BLUE,
                   lw=2.2, ms=14, zorder=6)

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Figure 5: composition order matters
# --------------------------------------------------------------------------
def make_fig05(path: Path):
    lim = (-2.9, 2.9)
    fig = plt.figure(figsize=(10, 7.6))
    gs = fig.add_gridspec(2, 3, left=0.045, right=0.955, top=0.815,
                          bottom=0.045, wspace=0.40, hspace=0.55)
    axes = [[fig.add_subplot(gs[r, c]) for c in range(3)] for r in range(2)]

    rows = [
        (r"先剪切，再旋转：得到 $BA$", ["原图", r"$H$ 之后", r"再 $R$ 之后"],
         [H, BA], "先 $H$", "再 $R$"),
        (r"先旋转，再剪切：得到 $AB$", ["原图", r"$R$ 之后", r"再 $H$ 之后"],
         [R, AB], "先 $R$", "再 $H$"),
    ]

    for r, (header, titles, mats, step1, step2) in enumerate(rows):
        fig.text(0.5, 0.935 if r == 0 else 0.455, header, ha="center",
                 va="center", fontsize=14, color=INK)
        for c in range(3):
            ax = axes[r][c]
            _panel(ax, lim, lim, title=titles[c], title_size=12.3,
                   title_pad=6, grid=(c == 0))
            if c == 0:
                _polygon(ax, _unit_square())
                _arrow(ax, (0, 0), (1, 0), ORANGE, lw=2.0, ms=11)
                _arrow(ax, (0, 0), (0, 1), BLUE, lw=2.0, ms=11)
            else:
                _draw_grid(ax, color=GRID, lw=0.8, ls=(0, (1.5, 2.8)),
                           alpha=0.55, zorder=0)
                _transformed_grid(ax, mats[c - 1], kmin=-4, kmax=4, span=7.5,
                                  color=GRID_DARK, lw=0.95, zorder=1)
                _polygon(ax, _unit_square(mats[c - 1]))

        # arrows between the three panels of this row
        y = (axes[r][0].get_position().y0 +
             axes[r][0].get_position().y1) / 2.0
        for c in range(2):
            x1 = axes[r][c].get_position().x1
            x2 = axes[r][c + 1].get_position().x0
            fig.add_artist(FancyArrowPatch(
                (x1 + 0.004, y), (x2 - 0.004, y),
                transform=fig.transFigure, arrowstyle="-|>",
                mutation_scale=9, lw=1.0, color=INK,
            ))
            fig.text((x1 + x2) / 2.0, y + 0.012,
                     step1 if c == 0 else step2, ha="center", va="bottom",
                     fontsize=11.5, color=INK)

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Figure 6: determinant as area scaling
# --------------------------------------------------------------------------
def make_fig06(path: Path):
    lim = (-1.5, 3.5)
    fig, axes = plt.subplots(1, 3, figsize=(10, 4.4))
    fig.subplots_adjust(left=0.035, right=0.965, bottom=0.045, top=0.855,
                        wspace=0.18)
    specs = [
        (r"剪切 $H$，$\det = 1$", H, "poly"),
        (r"拉伸 $S$，$\det = 2$", S, "poly"),
        (r"投影 $P$，$\det = 0$", P, "segment"),
    ]
    for ax, (title, matrix, kind) in zip(axes, specs):
        _panel(ax, lim, lim, title=title, title_size=13.5, title_pad=7,
               grid=False)
        _ghost_unit_square(ax, zorder=5)
        if kind == "poly":
            _polygon(ax, _unit_square(matrix))
            # faint transformed grid for context
            _transformed_grid(ax, matrix, kmin=-3, kmax=3, span=6.0,
                              color=GRID_DARK, lw=0.55, alpha=0.55, zorder=1)
        else:
            ax.plot([0, 1], [0, 0], color=TEAL, lw=5.0,
                    solid_capstyle="round", zorder=5)

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Figure 7: inverse undoes the shear
# --------------------------------------------------------------------------
def make_fig07(path: Path):
    xlim = (-1.6, 5.7)
    ylim = (-1.7, 4.0)
    fig, axes = plt.subplots(1, 3, figsize=(10, 4.7))
    fig.subplots_adjust(left=0.035, right=0.965, bottom=0.045, top=0.855,
                        wspace=0.18)

    ax = axes[0]
    _panel(ax, xlim, ylim, title="开始", title_size=14)
    _arrow(ax, (0, 0), (1, 0), ORANGE, lw=2.2, ms=14)
    _arrow(ax, (0, 0), (0, 1), BLUE, lw=2.2, ms=14)
    _dot(ax, (3, 2), INK, 46)
    _label(ax, 3.16, 2.23, r"$(3,2)^T$", INK, fs=13, ha="left", va="bottom")

    ax = axes[1]
    _panel(ax, xlim, ylim, title=r"经过 $H$ 之后", title_size=14, grid=False)
    _transformed_grid(ax, H, kmin=-3, kmax=6, span=6.5)
    _dot(ax, (5, 2), INK, 46)
    _label(ax, 4.82, 2.28, r"$(5,2)^T$", INK, fs=13, ha="right", va="bottom")

    ax = axes[2]
    _panel(ax, xlim, ylim, title=r"再经过 $H^{-1}$ 之后", title_size=13.5)
    # ghost of the sheared grid that is about to be undone
    _transformed_grid(ax, H, kmin=-3, kmax=6, span=6.5,
                      color=GHOST, lw=0.9, alpha=0.55, zorder=1,
                      ls=(0, (3.0, 3.0)))
    _dot(ax, (3, 2), INK, 46)
    _label(ax, 2.84, 2.23, r"$(3,2)^T$", INK, fs=13, ha="right", va="bottom")

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Figure 8: rank and nullity of the projection
# --------------------------------------------------------------------------
def make_fig08(path: Path):
    lim = (-2.7, 2.7)
    fig, axes = plt.subplots(1, 2, figsize=(10, 5.2))
    fig.subplots_adjust(left=0.045, right=0.955, bottom=0.045, top=0.89,
                        wspace=0.16)

    ax = axes[0]
    _panel(ax, lim, lim, title="原来的平面", title_size=15.5)
    ax.plot([0, 0], [lim[0] + 0.08, lim[1] - 0.08], color=RED, lw=2.3,
            ls=(0, (5.0, 4.0)), zorder=5, solid_capstyle="butt")
    _label(ax, 0.16, 2.05, "零空间", RED, fs=13, ha="left")

    ax = axes[1]
    _panel(ax, lim, lim, title="投影之后", title_size=15.5, grid=False)
    # rank-one image: the collapsed x-axis
    ax.add_patch(FancyArrowPatch((lim[0] + 0.02, 0), (lim[1] - 0.02, 0),
                                 arrowstyle="-|>", mutation_scale=12,
                                 lw=2.2, color=TEAL, shrinkA=0, shrinkB=0,
                                 zorder=4, clip_on=False))
    # collapsed horizontal grid lines: they all lie on the x-axis
    ax.plot([lim[0], lim[1]], [0, 0], color=GRID_DARK, lw=2.2,
            zorder=3, solid_capstyle="butt")
    # image of the unit square (drawn above the axis so it reads as a segment)
    ax.plot([0, 1], [0, 0], color=TEAL, lw=5.0, solid_capstyle="round",
            zorder=6)
    # collapsed vertical lines: dots on the x-axis
    ks = np.arange(math.ceil(lim[0]), math.floor(lim[1]) + 1)
    ax.scatter(ks, np.zeros_like(ks), s=24, color=GRID_DARK, zorder=7,
               edgecolors=_rgba(PAPER, 0.85), linewidths=0.5)
    _label(ax, 1.25, 0.30, r"像：一条直线（rank = 1）", TEAL, fs=11.5,
           ha="left")
    # vectors killed by the projection
    _arrow(ax, (0, 1), (0, 0), RED, lw=1.7, ms=11, zorder=8)
    _arrow(ax, (0, -1), (0, 0), RED, lw=1.7, ms=11, zorder=8)
    _label(ax, 0.18, 0.52, r"$\to 0$", RED, fs=11.5, ha="left")
    _label(ax, 0.18, -0.54, r"$\to 0$", RED, fs=11.5, ha="left")

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Figure 9: eigenvectors keep their direction
# --------------------------------------------------------------------------
def make_fig09(path: Path):
    lim = (-4.3, 4.3)
    fig, axes = plt.subplots(1, 2, figsize=(10, 5.2))
    fig.subplots_adjust(left=0.045, right=0.955, bottom=0.045, top=0.89,
                        wspace=0.16)

    ax = axes[0]
    _panel(ax, lim, lim, title="原来的网格", title_size=15.5)
    ax.plot([lim[0] + 0.1, lim[1] - 0.1], [lim[0] + 0.1, lim[1] - 0.1],
            color=ORANGE, lw=1.35, ls=(0, (5.0, 4.0)), alpha=0.75, zorder=2)
    ax.plot([lim[0] + 0.1, lim[1] - 0.1], [lim[1] - 0.1, lim[0] + 0.1],
            color=BLUE, lw=1.35, ls=(0, (5.0, 4.0)), alpha=0.75, zorder=2)
    _arrow(ax, (0, 0), (1, 1), ORANGE, lw=2.2, ms=14)
    _arrow(ax, (0, 0), (1, -1), BLUE, lw=2.2, ms=14)
    _arrow(ax, (0, 0), (2, 0), GRAY, lw=2.2, ms=14)
    _label(ax, 1.10, 1.34, r"$\mathbf{v}_1$", ORANGE, fs=13.5)
    _label(ax, 1.13, -1.40, r"$\mathbf{v}_2$", BLUE, fs=13.5)
    _label(ax, 2.12, 0.28, r"$\mathbf{w}$", GRAY, fs=13.5, ha="left")

    ax = axes[1]
    _panel(ax, lim, lim, title=r"经过 $M$ 之后", title_size=15.5, grid=False)
    _transformed_grid(ax, M, kmin=-4, kmax=4, span=8.0)
    ax.plot([lim[0] + 0.1, lim[1] - 0.1], [lim[0] + 0.1, lim[1] - 0.1],
            color=ORANGE, lw=1.35, ls=(0, (5.0, 4.0)), alpha=0.75, zorder=2)
    ax.plot([lim[0] + 0.1, lim[1] - 0.1], [lim[1] - 0.1, lim[0] + 0.1],
            color=BLUE, lw=1.35, ls=(0, (5.0, 4.0)), alpha=0.75, zorder=2)
    _ghost_segment(ax, (0, 0), (2, 0), GHOST, lw=1.3, alpha=0.9, zorder=3)
    _arrow(ax, (0, 0), (3, 3), ORANGE, lw=2.2, ms=14)
    _arrow(ax, (0, 0), (1, -1), BLUE, lw=2.2, ms=14)
    _arrow(ax, (0, 0), (4, 2), GRAY, lw=2.2, ms=14)
    _label(ax, 3.16, 3.30, r"$3\mathbf{v}_1$", ORANGE, fs=13.5, ha="left")
    _label(ax, 1.14, -1.40, r"$\mathbf{v}_2$", BLUE, fs=13.5)
    _label(ax, 3.80, 2.40, r"$M\mathbf{w}$", GRAY, fs=13.5, ha="right")

    _save_figure(fig, path)


# --------------------------------------------------------------------------
# Animation: continuous shear, seamless loop
# --------------------------------------------------------------------------
def make_gif(path: Path):
    from matplotlib.animation import FuncAnimation, PillowWriter

    xlim = (-2.8, 3.8)
    ylim = (-1.9, 2.3)
    n_frames = 36
    fps = 18

    fig = plt.figure(figsize=(8, 5.6), dpi=90)
    fig.set_facecolor(PAPER)
    ax = fig.add_axes([0.065, 0.135, 0.87, 0.735])
    _panel(ax, xlim, ylim, grid=False, title=None)
    fig.text(0.065, 0.955,
             r"连续剪切：$\mathbf{e}_2$ 逐渐倒向 $\mathbf{e}_1$",
             ha="left", va="top", fontsize=13.5, color=INK)

    # static artists
    _ghost_unit_square(ax)
    _ghost_segment(ax, (0, 0), (0, 1), BLUE, lw=1.5, alpha=0.38)
    _arrow(ax, (0, 0), (1, 0), ORANGE, lw=2.2, ms=14, zorder=7)
    _label(ax, 0.52, -0.24, r"$\mathbf{e}_1$", ORANGE, fs=12)

    # transformed grid lines
    vlines, hlines = [], []
    for k in range(-3, 4):
        vl, = ax.plot([], [], color=GRID, lw=0.8, zorder=1,
                      solid_capstyle="butt")
        hl, = ax.plot([], [], color=GRID, lw=0.8, zorder=1,
                      solid_capstyle="butt")
        vlines.append((k, vl))
        hlines.append((k, hl))

    square = Polygon(_unit_square(I).T, closed=True,
                     facecolor=_rgba(TEAL, 0.20),
                     edgecolor=_rgba(TEAL, 0.90), lw=1.6, zorder=4)
    ax.add_patch(square)
    e2_arrow = _arrow(ax, (0, 0), (0, 1), BLUE, lw=2.2, ms=14, zorder=7)
    e2_label = _label(ax, 0.0, 0.0, r"$\mathbf{e}_2$", BLUE, fs=12,
                      ha="left")

    # progress bar
    bar_ax = fig.add_axes([0.065, 0.055, 0.58, 0.020])
    bar_ax.set_xlim(0, 1)
    bar_ax.set_ylim(0, 1)
    bar_ax.axis("off")
    bar_ax.add_patch(Rectangle((0, 0), 1, 1, facecolor="#E6E1D5",
                               edgecolor="none"))
    bar_fill = Rectangle((0, 0), 0.001, 1, facecolor=ORANGE, edgecolor="none")
    bar_ax.add_patch(bar_fill)
    readout = fig.text(0.675, 0.052, "t = 0.00", ha="left", va="bottom",
                       fontsize=11.5, color=INK)

    def update(frame):
        t = 0.5 * (1.0 - math.cos(2.0 * math.pi * frame / n_frames))
        A = np.array([[1.0, t], [0.0, 1.0]])
        span = 8.0
        s = np.array([-span, span], float)
        for k, line in vlines:
            pts = A @ np.vstack([np.full(2, float(k)), s])
            line.set_data(pts[0], pts[1])
        for k, line in hlines:
            pts = A @ np.vstack([s, np.full(2, float(k))])
            line.set_data(pts[0], pts[1])
        square.set_xy(_unit_square(A).T)
        e2_arrow.set_positions((0, 0), (t, 1.0))
        e2_label.set_position((0.10 + t, 1.13))
        bar_fill.set_width(max(t, 0.001))
        readout.set_text(f"t = {t:.2f}")
        return [line for _, line in vlines] + \
               [line for _, line in hlines] + \
               [square, e2_arrow, e2_label, bar_fill, readout]

    anim = FuncAnimation(fig, update, frames=n_frames, init_func=None,
                         blit=False, interval=1000.0 / fps, repeat=True)
    path.parent.mkdir(parents=True, exist_ok=True)
    anim.save(path, writer=PillowWriter(fps=fps), dpi=90,
              savefig_kwargs={"facecolor": PAPER, "edgecolor": PAPER})
    plt.close(fig)
    _shrink_gif(path)


# --------------------------------------------------------------------------
# Cover art
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

    # faint grid over the entire canvas
    for x in np.arange(-1.0, 1.0001, 0.1):
        ax.plot([x, x], [-0.5625, 0.5625], color=NAVY_GRID, lw=0.65,
                zorder=0, alpha=0.9, solid_capstyle="butt")
    for y in np.arange(-0.55, 0.5501, 0.1):
        ax.plot([-1.0, 1.0], [y, y], color=NAVY_GRID, lw=0.65,
                zorder=0, alpha=0.9, solid_capstyle="butt")

    # sheared grid island (same shear as the article, scaled for the cover)
    T = np.array([[0.55, 0.22], [0.0, 0.40]])
    u = np.array([-1.0, 1.0], float)
    for k in np.arange(-1.0, 1.0001, 0.25):
        pts = T @ np.vstack([np.full(2, k), u])
        ax.plot(pts[0], pts[1], color="#1D4B57", lw=0.8, alpha=0.55,
                zorder=1, solid_capstyle="butt")
        pts = T @ np.vstack([u, np.full(2, k)])
        ax.plot(pts[0], pts[1], color="#1D4B57", lw=0.8, alpha=0.55,
                zorder=1, solid_capstyle="butt")

    # a couple of faint motion echoes
    for scale, alpha in ((0.86, 0.11), (0.70, 0.07)):
        pts = (T @ UNIT * scale).T
        ax.add_patch(Polygon(pts, closed=True, fill=False,
                             edgecolor=_rgba(TEAL, alpha), lw=1.4,
                             zorder=2))

    # transformed unit square
    pts = (T @ UNIT).T
    ax.add_patch(Polygon(pts, closed=True,
                         facecolor=_rgba(TEAL, 0.18),
                         edgecolor=_rgba(TEAL, 0.92), lw=2.2, zorder=3))

    # basis vectors
    ax.add_patch(FancyArrowPatch((0, 0), (0.55, 0.0), arrowstyle="-|>",
                                 mutation_scale=22, lw=4.0, color=ORANGE,
                                 shrinkA=0, shrinkB=0, zorder=5,
                                 clip_on=False, capstyle="round"))
    ax.add_patch(FancyArrowPatch((0, 0), (0.22, 0.40), arrowstyle="-|>",
                                 mutation_scale=22, lw=4.0, color=BLUE,
                                 shrinkA=0, shrinkB=0, zorder=5,
                                 clip_on=False, capstyle="round"))
    ax.scatter([0], [0], s=26, color="#F4F1E8", zorder=6, edgecolors="none")

    # thin shearing trails through the motif
    yy = np.linspace(-0.42, 0.42, 80)
    for x0 in (-0.34, 0.0, 0.34):
        xx = x0 + 0.10 * np.sin(np.pi * (yy + 0.42) / 0.84) - 0.05
        ax.plot(xx, yy, color=TEAL, lw=0.9, alpha=0.14, zorder=2)

    tmp = Path(tempfile.gettempdir()) / (path.stem + "-cover-art.png")
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(tmp, dpi=200, facecolor=NAVY, edgecolor=NAVY)
    plt.close(fig)

    # bloom + vignette, then size-controlled PNG encoding
    with Image.open(tmp) as im:
        art = im.convert("RGB")
    if art.size != (width, height):
        art = art.resize((width, height), Image.Resampling.LANCZOS)

    arr = np.asarray(art).astype(np.float32) / 255.0
    bg = np.array([0x0B, 0x12, 0x20], dtype=np.float32) / 255.0
    delta = np.clip(arr - bg, 0.0, 1.0)
    for sigma, strength in ((26.0, 0.55), (7.0, 0.35)):
        blurred = Image.fromarray((delta * 255.0).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(sigma))
        b = np.asarray(blurred).astype(np.float32) / 255.0
        arr = 1.0 - (1.0 - arr) * (1.0 - strength * b)

    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    cx, cy = width * 0.5, height * 0.48
    r = np.sqrt(((xx - cx) / (width * 0.62)) ** 2 +
                ((yy - cy) / (height * 0.72)) ** 2)
    vig = 1.0 - 0.48 * np.clip((r - 0.32) / 0.95, 0.0, 1.0) ** 1.4
    arr *= vig[..., None]

    out = Image.fromarray(np.clip(arr * 255.0, 0, 255).astype(np.uint8))
    out.save(path, "PNG", optimize=True, compress_level=9)
    tmp.unlink(missing_ok=True)

    if path.stat().st_size > 500 * 1024:
        for colors in (256, 192, 128):
            q = out.quantize(colors=colors, method=Image.MEDIANCUT,
                             dither=Image.NONE)
            q.save(path, "PNG", optimize=True, compress_level=9)
            if path.stat().st_size <= 500 * 1024:
                break


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out-root", type=Path, default=None,
                        help="optional staging root (default: repository root)")
    parser.add_argument("--skip-gif", action="store_true",
                        help="skip the animated GIF (QA only)")
    args = parser.parse_args()

    repo = Path(__file__).resolve().parents[1]
    root = args.out_root.resolve() if args.out_root else repo
    img_dir = root / "public" / "images" / "blog" / "matrix"
    cover_path = root / "src" / "assets" / "images" / "blog" / "matrix-cover.png"
    img_dir.mkdir(parents=True, exist_ok=True)
    cover_path.parent.mkdir(parents=True, exist_ok=True)

    jobs = [
        ("fig01-coordinates.png", make_fig01),
        ("fig02-shear.png", make_fig02),
        ("fig03-columns.png", make_fig03),
        ("fig04-zoo.png", make_fig04),
        ("fig05-compose.png", make_fig05),
        ("fig06-det.png", make_fig06),
        ("fig07-inverse.png", make_fig07),
        ("fig08-rank.png", make_fig08),
        ("fig09-eigen.png", make_fig09),
    ]
    for name, fn in jobs:
        fn(img_dir / name)
        print(f"  wrote {name}")

    if not args.skip_gif:
        make_gif(img_dir / "anim-shear.gif")
        print("  wrote anim-shear.gif")

    make_cover(cover_path)
    print(f"  wrote {cover_path.relative_to(root)}")

    print("\nfile                         dimensions      size")
    print("-" * 58)
    all_paths = [img_dir / name for name, _ in jobs]
    if not args.skip_gif:
        all_paths.append(img_dir / "anim-shear.gif")
    all_paths.append(cover_path)
    for p in all_paths:
        with Image.open(p) as im:
            print(f"{p.name:28s} {im.width:4d} x {im.height:<4d} "
                  f"{p.stat().st_size / 1024.0:7.1f} KB")


if __name__ == "__main__":
    main()
