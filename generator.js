#!/usr/bin/env node

import fs from "fs";
import glob from "glob";
import matter from "gray-matter";
import mkdirp from "mkdirp";
import path from "path";
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import string from "string";
import { mdToPdf } from "md-to-pdf";

/*
 * Function: slugify
 * Description: Converts a string into a slug, which is a URL-friendly version of a string.
 * Parameters: s - The string to be converted into a slug.
 * Returns: The slug version of the input string.
 */
const slugify = (s) => string(s).slugify().toString();

// Initializing MarkdownIt with options
const md = MarkdownIt({
  html: true, // Enable HTML tags in source
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification
  highlight(str, language) {
    // Highlight code blocks
    if (language && hljs.getLanguage(language)) {
      try {
        return hljs.highlight(str, { language }).value;
      } catch (err) {
        console.log(err);
      }
    }

    return null; // If no language is specified, return null
  },
}).use(markdownItAnchor, { slugify }); // Use markdown-it-anchor plugin with slugify function
/**
 * Reads a file and returns its content, parsed and rendered as HTML.
 * @param {string} filename - The filename to read.
 * @returns {object} - The parsed file content, including the rendered HTML.
 */
const readFile = (filename) => {
  const rawFile = fs.readFileSync(filename, "utf8");
  const parsed = matter(rawFile);
  const html = md.render(parsed.content);

  return { ...parsed, html };
};

/**
 * Replaces placeholders in a template string with provided data.
 * @param {string} template - The template string.
 * @param {object} data - The data object containing date, title, content, author, and description.
 * @returns {string} - The templated string with placeholders replaced by actual data.
 */
const templatize = (template, { date, title, content, author, description }) =>
  template
    .replace(/<!-- PUBLISH_DATE -->/g, date)
    .replace(/<!-- TITLE -->/g, title)
    .replace(/<!-- CONTENT -->/g, content)
    .replace(/<!-- DESCRIPTION -->/g, description);

/**
 * Replaces placeholders in an index page template string with provided data.
 * @param {string} template - The template string.
 * @param {object} data - The data object containing title and content.
 * @returns {string} - The templated string with placeholders replaced by actual data.
 */
const indextemplatize = (template, { title, content }) =>
  template
    .replace(/<!-- CONTENT -->/g, content)
    .replace(/<!-- TITLE -->/g, title);

/**
 * Replaces placeholders in a default page template string with provided data.
 * @param {string} template - The template string.
 * @param {object} data - The data object containing title, content, and description.
 * @returns {string} - The templated string with placeholders replaced by actual data.
 */
const defaulttempletize = (template, { title, content, description }) =>
  template
    .replace(/<!-- CONTENT -->/g, content)
    .replace(/<!-- TITLE -->/g, title)
    .replace(/<!-- DESCRIPTION -->/g, description);

/**
 * Saves a string to a file, creating the necessary directories if they don't exist.
 * @param {string} filename - The filename to save.
 * @param {string} contents - The contents to save.
 */
const saveFile = (filename, contents) => {
  const dir = path.dirname(filename);
  mkdirp.sync(dir);
  fs.writeFileSync(filename, contents);
};

/**
 * Generates the output filename for a given input filename and output path.
 * @param {string} filename - The filename to save.
 * @param {string} outPath - The output path.
 * @returns {string} - The output filename.
 */
const getOutputFilename = (filename, outPath) => {
  const basename = path.basename(filename);
  if (basename.includes("index.md")) return path.join(outPath, "index.html");
  const newfilename = `${basename.slice(0, -3)}.html`;
  const outfile = path.join(outPath, newfilename);
  return outfile;
};

/**
 * Generates the output PDF filename for a given input filename and output path.
 * @param {string} filename - The filename to save.
 * @param {string} outPath - The output path.
 * @returns {string} - The output PDF filename.
 */
const getOutputPdfname = (filename, outPath) => {
  const basename = path.basename(filename);
  const newfilename = `${basename.slice(0, -3)}.pdf`;
  const outfile = path.join(outPath, newfilename);
  return outfile;
};

/**
 * Processes a blog file: reads it, replaces placeholders in the template with actual data, and saves the result.
 * @param {string} filename - The filename to process.
 * @param {string} template - The template to use.
 * @param {string} outPath - The output path.
 */
const processBlogFile = (filename, template, outPath) => {
  const file = readFile(filename);
  const outfilename = getOutputFilename(filename, outPath);

  const templatized = templatize(template, {
    date: file.data.date,
    title: file.data.title,
    content: file.html,
    author: file.data.author,
    description: file.data.description,
  });
  saveFile(outfilename, templatized);
  //skipcq: JS-0002
  console.log(`📄 ${filename.split("/").slice(-1).join("/").slice(0, -3)}`);
};

/**
 * Processes a default file: reads it, replaces placeholders in the template with actual data, and saves the result.
 * Optionally generates a PDF version of the file.
 * @param {string} filename - The filename to process.
 * @param {string} template - The template to use.
 * @param {string} outPath - The output path.
 * @param {boolean} generatePdf - Whether to generate a PDF version of the file.
 */
const processDefaultFile = (
  filename,
  template,
  outPath,
  generatePdf = false
) => {
  const file = readFile(filename);
  const outfilename = getOutputFilename(filename, outPath);

  const templatized = defaulttempletize(template, {
    title: file.data.title,
    content: file.html,
    description: file.data.description,
  });
  if (generatePdf) {
    const outpdfname = getOutputPdfname(filename, outPath);
    mdToPdf({ path: filename }, { dest: outpdfname });
  }
  saveFile(outfilename, templatized);
  //skipcq: JS-0002
  console.log(`📄 ${filename.split("/").slice(-1).join("/").slice(0, -3)}`);
};

/**
 * Processes the current file: reads it, replaces placeholders in the template with actual data, and saves the result.
 * @param {string} filename - The filename to process.
 * @param {string} template - The template to use.
 * @param {string} outPath - The output path.
 */
const processCurrentFile = (filename, template, outPath) => {
  const file = readFile(filename);
  const outfilename = getOutputFilename(filename, outPath);
  const templatized = indextemplatize(template, {
    content: file.html,
    title: file.data.title,
  });
  saveFile(outfilename, templatized);
  //skipcq: JS-0002
  console.log(`📄 ${filename.split("/").slice(-1).join("/").slice(0, -3)}`);
};

/**
 * Processes the index file: reads it, replaces placeholders in the template with actual data, and saves the result.
 * @param {string} filename - The filename to process.
 * @param {string} template - The template to use.
 * @param {string} outPath - The output path.
 * @returns {string} - The output filename.
 */

const processIndexFile = (filename, template, outPath) => {
  const file = readFile(filename);
  const outfilename = getOutputFilename(filename, outPath);
  const templatized = indextemplatize(template, {
    content: file.html,
    title: file.data.title,
  });
  saveFile(outfilename, templatized);
  //skipcq: JS-0002
  console.log(`📄 ${filename.split("/").slice(-1).join("/").slice(0, -3)}`);
};

/**
 * Copies assets from the assets folder to the output folder.
 * @param {string} src - The source folder.
 * @param {string} dest - The destination folder.
 **/
const copyAssets = (src, dest, depth = 0) => {
  const files = fs.readdirSync(src);
  files.forEach((file) => {
    if (file === ".DS_Store") {
      return;
    }
    const srcFile = path.join(src, file);
    const destFile =
      depth === 0 && fs.statSync(srcFile).isDirectory()
        ? path.join(dest, "assets", file)
        : path.join(dest, file);
    if (fs.statSync(srcFile).isDirectory()) {
      fs.mkdirSync(destFile, { recursive: true });
      copyAssets(srcFile, destFile, depth + 1);
    } else {
      const destDir = path.dirname(destFile);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const contents = fs.readFileSync(srcFile);
      fs.writeFileSync(destFile, contents);
    }
  });
};

/**
 * Main function that orchestrates the processing of all markdown files.
 */
const main = () => {
  const srcPath = path.resolve("content");
  const outPath = path.resolve(".dist/blog");
  const dir = path.resolve(".dist/blog");
  const indexoutPath = path.resolve(".dist");
  const assetsPath = path.resolve("assets");
  const blogtemplate = fs.readFileSync("./templates/initial/blog.html", "utf8");
  const indextemplate = fs.readFileSync(
    "./templates/initial/index.html",
    "utf8"
  );
  const currenttemplate = fs.readFileSync(
    "./templates/initial/current.html",
    "utf8"
  );
  const blogindextemplate = fs.readFileSync(
    "./templates/initial/blogindex.html",
    "utf8"
  );
  const defaultemplate = fs.readFileSync(
    "./templates/initial/default.html",
    "utf8"
  );
  const filenames = glob.sync(`${srcPath}/**/*.md`);

  const expiredFiles = ["stackit.tech"];

  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });

  const templateMap = {
    blog: blogtemplate,
    index: indextemplate,
    current: currenttemplate,
    blogindex: blogindextemplate,
    default: defaultemplate,
  };

  filenames.forEach((filename) => {
    switch (filename.split("/").slice(-1)[0]) {
      case "index.md":
        processIndexFile(filename, templateMap.index, indexoutPath);
        break;
      case "current.md":
        processCurrentFile(filename, templateMap.current, indexoutPath);
        break;
      case "blogindex.md":
        processIndexFile(filename, templateMap.blogindex, outPath);
        break;
      case "cv.md":
        processDefaultFile(filename, templateMap.default, indexoutPath, true);
        break;
      case "journey.md":
      case "reading.md":
        processDefaultFile(filename, templateMap.default, indexoutPath);
        break;
      default:
        if (!expiredFiles.some((el) => filename.includes(el)))
          processBlogFile(filename, templateMap.blog, outPath);
    }
  });

  copyAssets(assetsPath, indexoutPath);
};

main();
