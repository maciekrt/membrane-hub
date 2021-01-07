#! /bin/bash

PORT=$(cat .env.local | grep ^PORT= | cut -d'=' -f2)
echo "Starting npm run dev on port: $PORT"
npm run dev -- -p $PORT