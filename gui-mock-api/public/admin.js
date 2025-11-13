(function () {
  const jsonFields = document.querySelectorAll('textarea[data-json-field]');
  for (const field of jsonFields) {
    field.addEventListener('blur', () => {
      const value = field.value.trim();
      if (!value) {
        return;
      }
      try {
        const parsed = JSON.parse(value);
        field.value = JSON.stringify(parsed, null, 2);
        field.setCustomValidity('');
      } catch (err) {
        field.setCustomValidity('Invalid JSON');
      }
    });
    field.addEventListener('input', () => field.setCustomValidity(''));
  }
})();
