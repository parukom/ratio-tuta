type Props = {
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const Logo = ({ size = '4xl' }: Props) => {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-md',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl'
    };
    return (
        <div className="flex items-center">
            <span className={`font-black -tracking-[3px] text-gray-900 dark:text-white ${sizeClasses[size]}`}>ratiotuta<span className="text-[90px] leading-0">.</span></span>
        </div>
    )
}

export default Logo
