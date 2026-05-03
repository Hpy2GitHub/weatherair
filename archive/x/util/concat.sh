#!/usr/bin/bash

# Argument 1: Scope (src | config | all) - default to 'src'
SCOPE=${1:-src}
# Argument 2: List toggle (list | nolist) - default to 'nolist'
SHOW_LIST=${2:-nolist}

rhd=/mnt/c/Users/rho/Downloads
dst=$rhd/project-contents.txt
>$dst

# Save the starting directory
ROOT_DIR=$(pwd)

# 1. Determine the files to include based on the scope
if [ "$SCOPE" == "src" ]
then
    cd ./src
    echo "only packing src ..."
    files=$(find * | grep -v node | grep -v ico$ | grep -v jpg$ | grep -v png$ | grep -v "bak/" | grep -v bak$  | grep -v dist | grep -v comments.txt | grep -v  public )
elif [ "$SCOPE" == "config" ]
then
    echo "not including src (config) ..."
    files=$(find * | grep -v node | grep -v ico$ | grep -v jpg$ | grep -v png$ | grep -v "bak/" | grep -v bak$  | grep -v dist | grep -v comments.txt | grep -v  public| grep -v src | grep  -v mp4 | grep -v docs | grep -v util)
elif [ "$SCOPE" == "all" ]
then
    echo "including everything ..."
    files=$(find * | grep -v node | grep -v ico$ | grep -v jpg$ | grep -v png$ | grep -v "bak/" | grep -v bak$  | grep -v dist | grep -v comments.txt)
else
    echo "Error: Unknown scope '$SCOPE'. Valid options are: src, config, all"
    exit 1
fi

# 2. Output the contents of the files in the current scope
for i in $files
do
    if [ ! -d "$i" ]
    then
        echo "============="
        echo " FILE: $i"
        echo "============="
        cat "$i"
    fi
done > "$dst"

# 3. Conditionally add the "everything" list at the end
if [ "$SHOW_LIST" == "list" ]
then
    cd "$ROOT_DIR"
    {
        echo ""
        echo "===="
        echo "FILE LIST"
        echo "==="
        # Logic for the "everything" list
        all_files=$(find * | grep -v node | grep -v ico$ | grep -v jpg$ | grep -v png$ | grep -v "bak/" | grep -v bak$  | grep -v dist | grep -v comments.txt)
        for f in $all_files
        do
            if [ ! -d "$f" ]
            then
                echo "$f"
            fi
        done
    } >> "$dst"
fi

echo "Done. Contents written to $dst (List: $SHOW_LIST)"
