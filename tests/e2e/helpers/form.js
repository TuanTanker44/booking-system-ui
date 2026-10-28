export async function disableHtml5Validation(driver, inputLocator) {
  const input = await driver.findElement(inputLocator);
  await driver.executeScript(
    'arguments[0].form && (arguments[0].form.noValidate = true)',
    input
  );
}
