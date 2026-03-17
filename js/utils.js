function cut(code) {
  if (!code) return "";
  let cleaned = "";
  for (let i = 0; i < code.length; i++) {
    if (code[i] === "/") {
      if (code[i + 1] === "/") {
        while (i < code.length && code[i] !== "\n") i++;
        continue;
      } else if (code[i + 1] === "*") {
        i += 2;
        while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) i++;
        i++;
        continue;
      }
    }
    cleaned += code[i];
  }
  return cleaned
    .split(/\r\n|\r|\n/)
    .map(l => l.trim())
    .filter(l => l !== "")
    .join("\n");
}
