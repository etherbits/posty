import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Dropdown.module.css";

export function Dropdown({
	value,
	onChange,
	children,
	className = "",
	wrapperClassName = "",
	disabled = false,
	fullWidth = true,
	...props
}) {
	const [isOpen, setIsOpen] = useState(false);
	const wrapperRef = useRef(null);

	const options = useMemo(
		() =>
			Children.toArray(children)
				.filter((child) => isValidElement(child))
				.map((child) => ({
					value: child.props.value,
					label: child.props.children,
					disabled: child.props.disabled,
				})),
		[children],
	);

	const selectedOption =
		options.find((option) => option.value === value) || options[0];

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (!wrapperRef.current?.contains(event.target)) {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	const handleToggle = () => {
		if (disabled) return;
		setIsOpen((prev) => !prev);
	};

	const handleSelect = (nextValue, optionDisabled) => {
		if (disabled || optionDisabled) return;
		setIsOpen(false);
		if (onChange) {
			onChange({ target: { value: nextValue } });
		}
	};

	return (
		<div
			ref={wrapperRef}
			className={`${styles.wrapper} ${
				fullWidth ? styles.fullWidth : ""
			} ${wrapperClassName}`}
		>
			<button
				type="button"
				className={`${className} ${styles.trigger}`}
				onClick={handleToggle}
				disabled={disabled}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				{...props}
			>
				<span className={styles.value}>{selectedOption?.label}</span>
				<span className={styles.arrow} aria-hidden />
			</button>
			{isOpen && (
				<div className={styles.menu} role="listbox">
					{options.map((option) => (
						<button
							key={option.value}
							type="button"
							role="option"
							aria-selected={option.value === value}
							className={`${styles.option} ${
								option.value === value ? styles.optionActive : ""
							} ${option.disabled ? styles.optionDisabled : ""}`}
							onClick={() => handleSelect(option.value, option.disabled)}
							disabled={option.disabled}
						>
							{option.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
