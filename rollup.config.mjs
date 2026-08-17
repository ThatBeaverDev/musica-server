import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import alias from "@rollup/plugin-alias";
import postcss from "rollup-plugin-postcss";

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
				__buildVersion: 15,
				preventAssignment: true
			}),
			alias({
				entries: [
					{ find: "react", replacement: "preact/compat" },
					{
						find: "react-dom/test-utils",
						replacement: "preact/test-utils"
					},
					{ find: "react-dom", replacement: "preact/compat" },
					{
						find: "react/jsx-runtime",
						replacement: "preact/jsx-runtime"
					}
				]
			}),
			postcss({
				extract: "app.css",
				modules: true,
				minimize: true
			})
		]
	}
];
