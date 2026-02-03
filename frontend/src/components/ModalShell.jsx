import { X } from "lucide-react";

export function ModalShell({
	isOpen,
	onClose,
	styles,
	title,
	subtitle,
	children,
}) {
	return (
		<div
			className={`${styles.overlay} ${isOpen ? styles.open : ""}`}
			aria-hidden={!isOpen}
			onClick={onClose}
		>
			<div
				className={`${styles.modal} ${isOpen ? styles.open : ""}`}
				onClick={(event) => event.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<div className={styles.header}>
					<div>
						<h3 className={styles.title}>{title}</h3>
						{subtitle ? (
							<p className={styles.subtitle}>{subtitle}</p>
						) : null}
					</div>
					<button
						type="button"
						className={styles.close}
						onClick={onClose}
					>
						<X size={18} />
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}
