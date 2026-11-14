#!/bin/zsh
cd "/Volumes/Projets/FRANC NORD" || exit 1

if ! lsof -i :4321 >/dev/null 2>&1; then
  nohup /opt/homebrew/bin/node "/Volumes/Projets/FRANC NORD/server.mjs" >/tmp/franc-nord-studio.log 2>&1 &
  sleep 1
fi

open "http://127.0.0.1:4321/studio/index.html"
