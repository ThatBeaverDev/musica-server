import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

export default [
	{
		input: "./build/client/index.js",
		output: {
			file: `./public/app.js`,
			format: "es"
		},
		plugins: [
			resolve(),
			commonjs(),
			replace({
				"process.env.NODE_ENV": JSON.stringify("development"),
				__buildDate__: () => JSON.stringify(new Date()),
				__buildVersion: 15
			})
		]
	}
];
