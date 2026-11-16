function hello() {
  return "Hello. world!"
}

if (require.main === module) {
  console.log(hello())
}

module.exports = { hello }
