#!/usr/bin/bash
for i in $(ls *.jsx)
do
#n=$(grep className $i | wc -l)
n=$(wc -l $i)
echo $n $i
done

