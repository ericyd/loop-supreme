#!/bin/sh

# If you are looking at this file and thinking
# "That's quite an unusual thing to do in a post-build script"
# Then you passed the test!
# If you comment out this script and run `npm run build`,
# you'll notice that the file build/static/media/recorder.[hash].js contains invalid code.
# In particular, it contains import statements that reference absolute file paths on the
# machine that built the code.
# I believe this is related to this webpack bug https://github.com/webpack/webpack/issues/11543.
# It seems that webpack 5 solved the build issue with Workers, but AudioWorkletProcessors do not
# get treated the same way.
# This is clearly not a scalable or "good" solution, but it works.
# Since this project doesn't need to be tightly buttoned up, I'm considering it fine.

for filepath in build/static/media/*.js; do
  filename=$(basename $filepath | sed -E 's|([^\.]+).*|\1|')
  cp src/worklets/$filename.js "build/static/media/$(ls build/static/media | grep $filename)"
done
