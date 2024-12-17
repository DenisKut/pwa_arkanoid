import cn from 'clsx';

import styles from './Button.module.scss'

// eslint-disable-next-line react/prop-types
export const Button = ({ children, ...rest }) => {
	return (
		<button 
			className={cn(styles.button, rest.className)} 
			{...rest}
		>
			{children}
		</button>
	)
} 