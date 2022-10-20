echo "Fixing Prisma client..."

sed -i 's/this.datamodel = import_fs6.default.readFileSync(config2.datamodelPath, "utf-8");/const myPath = config2.generator.output.value + "\/schema.prisma";this.datamodel = import_fs6.default.readFileSync(myPath, "utf-8");/g' ./.generated/client/runtime/index.js
sed -i 's/this.datamodel = import_fs6.default.readFileSync(config2.datamodelPath, "utf-8");/const myPath = config2.generator.output.value + "\/schema.prisma";this.datamodel = import_fs6.default.readFileSync(myPath, "utf-8");/g' ../../apps/nextjs/.next/server/chunks/*.js || true
