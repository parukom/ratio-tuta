type Props = {
    id?: string;
    name?: string;
    type: string;
    value?: string;
    placeholder?: string;
    className?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    hideLabel?: boolean;
}

const Input = ({ id, name, type, value, placeholder, className = '', onChange, min, max, minLength, maxLength, hideLabel = false }: Props) => {
    return (
        <div>
            {!hideLabel && (
                <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                    {placeholder}
                </label>
            )}
            <div className={hideLabel ? '' : 'mt-2'}>
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    minLength={minLength}
                    maxLength={maxLength}
                    className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 ${className}`}
                    onChange={onChange}
                />
            </div>
        </div>
    )
}

export default Input;