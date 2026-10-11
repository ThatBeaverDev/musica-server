npx tsc

# copy .css files across
rsync -avm --include='*/' --include='*.css' --exclude='*' web/ build/

npx rollup -c
