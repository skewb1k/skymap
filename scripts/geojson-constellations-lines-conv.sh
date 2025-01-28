#!/bin/bash

input_file=$1
output_file=$2

jq -c '
[
    .features |.[] |
    {
        id: .properties.id,
        rank: .properties.rank | tonumber,
        vertices: .geometry.coordinates
    }
]
' "$input_file" >"$output_file"
