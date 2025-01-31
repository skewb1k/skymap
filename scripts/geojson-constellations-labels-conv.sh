#!/bin/bash

input_file=$1
output_file=$2

jq -c '
[.features[] |
    {
        key: (.id),
        value: {
            coords:.geometry.coordinates,
            labels: .properties | del(.name, .rank, .gen, .display, .desig)
        }
    }
] | from_entries
' "$input_file" >"$output_file"
