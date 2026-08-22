@echo off
setlocal enabledelayedexpansion

set srcdir=E:\Temp\map_tiles
set dstdir=%~dp0tiles

set tileSize=4096
set tw=16
set th=16
set SIZE=512

set /a th_minus_1=%th%-1
set /a tw_minus_1=%tw%-1

cd /d %srcdir%

if not exist row_0.v (
    for /l %%y in (0,1,%th_minus_1%) do (
        set /a sy=th_minus_1-%%y
        set "row_files="

        for /l %%x in (0,1,%tw_minus_1%) do (
            set "x=00%%x"
            set "y=00!sy!"
            set "x=!x:~-3!"
            set "y=!y:~-3!"
            set "src=tile_!x!_!y!.png"

            if defined row_files (
                set "row_files=!row_files! !src!"
            ) else (
                set "row_files=!src!"
            )
        )

        echo !row_files!
        vips arrayjoin "!row_files!" row_%%y.v --across %tw% --vips-progress
    )
)

if not exist merged.v (
    set "all_rows="

    for /l %%y in (0,1,%th_minus_1%) do (
        if defined all_rows (
            set "all_rows=!all_rows! row_%%y.v"
        ) else (
            set "all_rows=row_%%y.v"
        )
    )

    vips arrayjoin "!all_rows!" merged.v --across 1 --vips-progress
)

if not exist "%dstdir%" (
    mkdir "%dstdir%" 2>nul
    vips dzsave merged.v "%dstdir%" --layout google --tile-size %SIZE% --suffix .webp[Q=50] --centre --vips-progress
)
