#!/bin/bash

input_file=$1
output_file=$2

jq -c '
    {
        mag: {
            min: [.[].mag] | min,
            max: [.[].mag] | max
        },
        bv: {
            min: [.[].bv] | min,
            max: [.[].bv] | max
        },
        total: length,
        stars: .
    }
' "$input_file" >"$output_file"
