#!/usr/bin/env bash

#Bundle files for PythonAnywhere deploy.
#Direct PythonAnywhere easy setup to $HOME/run.py


#"pack" or "unpack" as argument.
ACTION=$1


if [ "$ACTION" == "pack" ]; then
  echo Packing...
  npm run build-prod
  tar \
    --exclude='__pycache__/' \
    --exclude='.DS_Store' \
    -zcf bundle.tgz \
    web/ \
    ./run.py \
    scripts/scheduled_task.py \
    scripts/optimize_db.py \
    scripts/pythonanywhere.sh
  echo All packed.

elif [ "$ACTION" == "unpack" ]; then
  echo Unpacking...
  rm -rf web/
  tar -zxf bundle.tgz
  echo All unpacked.

else
  echo "Unknown action use commands 'pack' or 'unpack'."
fi
