import { useState, useEffect } from "react";
import { Input } from "@/shared/components/ui/input";
import { convertDDMMYYYYToHTMLDate, convertHTMLDateToDDMMYYYY } from "@/shared/lib/dateUtils";

interface DateInputProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
  required?: boolean;
  min?: string;
  max?: string;
}

export default function DateInput({
  id,
  value = "",
  onChange,
  placeholder = "dd/mm/aaaa",
  className,
  "data-testid": testId,
  required = false,
  min,
  max,
  ...props
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isValid, setIsValid] = useState(true);

  // Convert HTML date (yyyy-mm-dd) to display format (dd/mm/yyyy) on mount and value change
  useEffect(() => {
    if (value) {
      const converted = convertHTMLDateToDDMMYYYY(value);
      setDisplayValue(converted);
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    // Validate and convert dd/mm/yyyy to yyyy-mm-dd for HTML compatibility
    if (inputValue.length === 10) { // Complete date: dd/mm/yyyy
      const htmlDate = convertDDMMYYYYToHTMLDate(inputValue);
      if (htmlDate) {
        setIsValid(true);
        onChange?.(htmlDate);
      } else {
        setIsValid(false);
      }
    } else if (inputValue === "") {
      setIsValid(true);
      onChange?.("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const char = e.key;
    const currentValue = displayValue;
    
    // Allow numbers, slashes, backspace, delete, arrow keys, tab
    if (!/\d|\//.test(char) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(char)) {
      e.preventDefault();
      return;
    }

    // Auto-add slashes at positions 2 and 5
    if (/\d/.test(char)) {
      const newLength = currentValue.length + 1;
      if (newLength === 3 || newLength === 6) {
        // Don't add slash if user is typing it manually
        if (currentValue.slice(-1) !== '/') {
          setTimeout(() => {
            setDisplayValue(prev => prev + '/');
          }, 0);
        }
      }
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} ${!isValid ? 'border-red-500' : ''}`}
        data-testid={testId}
        required={required}
        maxLength={10}
        {...props}
      />
      {!isValid && displayValue.length === 10 && (
        <p className="text-red-500 text-xs mt-1">
          Data inválida. Use o formato dd/mm/aaaa
        </p>
      )}
    </div>
  );
}