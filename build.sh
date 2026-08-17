# client code
npx tsc
# copy .css files across
rsync -avm --include='*/' --include='*.css' --exclude='*' src/ build/

npx rollup -c

# server code
go build