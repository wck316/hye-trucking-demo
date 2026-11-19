export const callingCodes = [
  ['1', '美国 / 加拿大'], ['86', '中国大陆'], ['52', '墨西哥'], ['44', '英国'],
  ['852', '中国香港'], ['886', '中国台湾'], ['65', '新加坡'], ['61', '澳大利亚'],
  ['49', '德国'], ['33', '法国'], ['81', '日本'], ['82', '韩国'], ['91', '印度'], ['971', '阿联酋']
];
const extensionPattern = /\s*(?:ext(?:ension)?\.?|x|#|分机号?|转)\s*[:：]?\s*(\d{1,12})\s*$/i;

export function parsePhone(value = '', country = '1') {
  let number = String(value).trim().replace(/[０-９]/g, digit => String(digit.charCodeAt(0) - 0xff10)).replace(/＋/g, '+');
  const extensionMatch = number.match(extensionPattern);
  const extension = extensionMatch?.[1] ?? '';
  if (extensionMatch) number = number.slice(0, extensionMatch.index).trim();
  if (/^(?:\+|00)/.test(number)) {
    number = number.replace(/^(?:\+|00)\s*/, '');
    const code = callingCodes.map(([code]) => code).sort((a, b) => b.length - a.length)
      .find(code => number.startsWith(code));
    country = code ?? number.match(/^(\d{1,3})(?=[\s().-])/)?.[1] ?? '';
    number = number.slice(country.length).trim();
  } else if (country === '1' && number.replace(/\D/g, '').length === 11 && /^1/.test(number)) {
    number = number.slice(1).trim();
  }
  return { country, number, extension };
}

function formatNumber(number, country) {
  const digits = number.replace(/\D/g, '');
  return country === '1' && digits.length === 10 && /^[\d\s().-]+$/.test(number)
    ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : number;
}

function extensionInput(input) {
  const name = /Phone$/.test(input.name) ? input.name + 'Extension' : input.name === 'phone' ? 'phoneExtension' : '';
  return name ? input.form?.elements.namedItem(name) : null;
}

function synchronize(input) {
  const group = input.closest('[data-phone-field]');
  const select = group.querySelector('[data-phone-country]');
  const parsed = parsePhone(input.value, select.value);
  if (![...select.options].some(option => option.value === parsed.country)) {
    select.add(new Option(parsed.country ? '+' + parsed.country : '国际', parsed.country));
  }
  select.value = parsed.country;
  for (const option of select.options) {
    option.label = option.selected ? (option.value ? '+' + option.value : '国际') : option.text;
  }
  select.title = callingCodes.find(([code]) => code === select.value)?.[1] ?? '+' + select.value;
  input.placeholder = select.value === '1' ? '(213) 555-0100' : '请输入电话号码';
  const extension = extensionInput(input);
  if (parsed.extension && extension) extension.value = parsed.extension;
  input.value = formatNumber(parsed.number, parsed.country) + (parsed.extension && !extension ? ' ext. ' + parsed.extension : '');
  return parsed;
}

function validatePhone(input, showError) {
  const group = input.closest('[data-phone-field]');
  const { country, number } = parsePhone(input.value, group.querySelector('[data-phone-country]').value);
  const count = number.replace(/\D/g, '').length;
  let error = '';
  if (number && !/^[\d\s().-]+$/.test(number)) error = '请输入有效的电话号码';
  else if (number && (country === '1' ? count !== 10 : count < 6 || country.length + count > 15)) {
    error = country === '1' ? '美国 / 加拿大号码需填写 10 位数字' : '请检查号码长度和国家区号';
  }
  input.setCustomValidity(error);
  const message = group.querySelector('[data-phone-error]');
  message.textContent = error;
  message.hidden = !showError || !error;
  input.setAttribute('aria-invalid', String(Boolean(showError && error)));
}

export function initializePhoneInputs(root) {
  root.querySelectorAll('[data-phone-number]').forEach(input => {
    if (input.dataset.phoneReady) return;
    const original = input.value;
    const parsed = synchronize(input);
    Object.assign(input.dataset, {
      phoneOriginal: extensionInput(input) ? original.replace(extensionPattern, '').trim() : original, phoneInitialCountry: parsed.country,
      phoneDigits: parsed.number.replace(/\D/g, ''), phoneExtension: extensionInput(input) ? '' : parsed.extension,
      phoneReady: 'true'
    });
    input.setCustomValidity('');
    input.setAttribute('aria-invalid', 'false');
    input.closest('[data-phone-field]').querySelector('[data-phone-error]').hidden = true;
  });
}

export function setPhoneInputValue(input, value) {
  input.value = value;
  if (!input.matches('[data-phone-number]')) return;
  delete input.dataset.phoneReady;
  input.closest('[data-phone-field]').querySelector('[data-phone-country]').value = '1';
  initializePhoneInputs(input.closest('[data-phone-field]'));
}

export function phoneInputValue(input) {
  const countryInput = input.closest('[data-phone-field]').querySelector('[data-phone-country]');
  const { country, number, extension } = parsePhone(input.value, countryInput.value);
  const digits = number.replace(/\D/g, '');
  const inlineExtension = extensionInput(input) ? '' : extension;
  const unchanged = input.dataset.phoneInitialCountry === country && input.dataset.phoneDigits === digits && input.dataset.phoneExtension === inlineExtension;
  if (unchanged) return input.dataset.phoneOriginal;
  return digits ? `+${country}${country ? ' ' : ''}${formatNumber(digits, country)}${inlineExtension ? ' ext. ' + inlineExtension : ''}` : '';
}

document.addEventListener('input', event => {
  if (event.target.matches('[data-phone-number]')) validatePhone(event.target, false);
});
document.addEventListener('focusout', event => {
  if (!event.target.matches('[data-phone-number]')) return;
  synchronize(event.target);
  validatePhone(event.target, true);
});
document.addEventListener('change', event => {
  if (!event.target.matches('[data-phone-country]')) return;
  const input = event.target.closest('[data-phone-field]').querySelector('[data-phone-number]');
  synchronize(input);
  validatePhone(input, true);
  input.focus();
});
document.addEventListener('invalid', event => {
  if (event.target.matches('[data-phone-number]')) validatePhone(event.target, true);
}, true);
document.addEventListener('formdata', event => {
  event.target.querySelectorAll('[data-phone-number]').forEach(input => {
    if (input.matches(':disabled') || !event.formData.has(input.name)) return;
    const { extension } = parsePhone(input.value);
    const separateExtension = extensionInput(input);
    if (extension && separateExtension) event.formData.set(separateExtension.name, extension);
    event.formData.set(input.name, phoneInputValue(input));
  });
});
