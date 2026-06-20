import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { string } from "rollup-plugin-string";

import { builtinModules } from "node:module";

const external = [
	...builtinModules,
	// handle names like 'node:fs', which isn't part of the above list.
	...builtinModules.map((item) => "node:" + item)
];

export default [
	// Client bundle
	{
		input: "build/client/client.js",
		output: {
			file: "./build/client.js",
			format: "es",
			inlineDynamicImports: true
		},
		plugins: [
			nodeResolve({
				browser: true,
				preferBuiltins: false
			}),
			commonjs({ ignoreDynamicRequires: true }),
			string({
				include: ["**/*"],
				exclude: ["**/*.js"]
			}),
			json()
		],
		external
	}
];
