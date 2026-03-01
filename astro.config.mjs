// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import remarkCustomContainer from "@echoja/remark-custom-container";
import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSectionize from "@hbsnow/rehype-sectionize";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const remarkCodeHikeMod = await import(
  path.join(__dirname, "mdx-plugins/remark-codehike.mjs")
);
const remarkCodeHike = remarkCodeHikeMod.default;

/** @type {import('codehike/mdx').CodeHikeConfig} */
const chConfig = {
  components: {
    code: "Code",
  },
};

/** @type {import("@echoja/remark-custom-container").CustomContainerOptions} */
const customContainerOptions = {
  optionsByClassName: [
    {
      selector: "details",
      containerTag: "details",
      titleTag: "summary",
    },
  ],
};

// https://astro.build/config
export default defineConfig({
  site: "https://springfall.cc",
  output: "static",

  image: {
    layout: "constrained",
    responsiveStyles: true,
  },

  integrations: [
    react(),
    mdx({
      remarkPlugins: [
        [remarkCustomContainer, customContainerOptions],
        remarkGfm,
        [remarkCodeHike, chConfig],
        [remarkToc, { heading: "목차|Table of Contents" }],
      ],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            properties: {
              ariaHidden: true,
              tabIndex: -1,
              className: "heading-anchor",
            },
            content: {
              type: "element",
              tagName: "svg",
              properties: {
                className: "icon-link",
                xmlns: "http://www.w3.org/2000/svg",
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
              },
              children: [
                {
                  type: "element",
                  tagName: "path",
                  properties: {
                    d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
                  },
                },
                {
                  type: "element",
                  tagName: "path",
                  properties: {
                    d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
                  },
                },
              ],
            },
          },
        ],
        rehypeSectionize,
      ],
    }),
    sitemap({
      i18n: {
        defaultLocale: "ko",
        locales: {
          ko: "ko",
          en: "en",
        },
      },
    }),
  ],

  redirects: {
    "/post/12": "/article/2023-03/draw-io-auto-layout",
    "/post/11": "/article/2023-02/knou-tips",
    "/post/10": "/article/2023-02/puss-in-boots",
    "/post/9": "/article/2022-11/i-me-mom-mom",
    "/post/7": "/article/2022-11/easy-promise-async-await",
    "/post/5": "/article/2022-10/javascript-smooth-animation",
    "/post/6": "/article/2022-11/everything",
    "/post/3": "/article/2023-07/ts-data-structure",
    "/post/2": "/article/2022-10/hello-sadness",
    "/post/1": "/article/2022-09/company",
  },
});
