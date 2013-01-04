#!/bin/sh

find NerdPursuit/questions -name "*.json" | while read i; do echo `cat "$i"`; done > nerd_pursuit_compressed.json
