import "./admin-shared.css";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

export function FormField({
  label,
  value,
  onChange,
  maxLength,
  multiline,
  type = "text",
  placeholder,
  required,
}: Props) {
  const charInfo = maxLength ? `${value.length}/${maxLength}` : null;
  return (
    <div className="adm-field">
      <label className="adm-field__label">
        {label}
        {required && <span className="adm-field__req">*</span>}
      </label>
      {multiline ? (
        <textarea
          className="adm-field__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          className="adm-field__input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      )}
      {charInfo && <span className="adm-field__count">{charInfo}</span>}
    </div>
  );
}
