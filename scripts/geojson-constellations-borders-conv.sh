#!/bin/bash

input_file=$1
output_file=$2

jq -c '
[
    .features |.[] |
    {
        ids: .properties.ids | split(","),
        vertices: .geometry.coordinates
    }
]
' "$input_file" >"$output_file"
