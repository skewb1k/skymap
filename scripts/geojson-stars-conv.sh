#!/bin/bash

input_file=$1
output_file=$2

jq -c '
    [
        .features | .[] | {
        id: .id,
        mag: .properties.mag,
        bv: (.properties.bv | select(. != "") | tonumber // 0),
        lon: .geometry.coordinates[0],
        lat: .geometry.coordinates[1]}
    ]
' "$input_file" >"$output_file"
