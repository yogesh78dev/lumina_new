import { ReactNode } from 'react';

// Since sweetalert2 is added via CDN, we declare it globally for TypeScript.
declare const Swal: any;

type ToastIcon = 'success' | 'error' | 'warning' | 'info' | 'question';

interface ConfirmOptions {
    title: string;
    html: ReactNode | string; // Allow JSX or string
    confirmButtonText?: string;
}

export const useSwal = () => {
    /**
     * Shows a beautiful confirmation modal.
     * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false otherwise.
     */
    const confirmDelete = ({ title, html, confirmButtonText = 'Yes, delete it!' }: ConfirmOptions): Promise<boolean> => {
        return Swal.fire({
            title: title,
            html: html,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c4161c', // primary color
            cancelButtonColor: '#6b7280', // gray
            confirmButtonText: confirmButtonText,
            customClass: {
                popup: 'rounded-xl',
                confirmButton: 'px-4 py-2 font-semibold',
                cancelButton: 'px-4 py-2 font-semibold'
            }
        }).then((result: { isConfirmed: boolean }) => {
            return result.isConfirmed;
        });
    };

    /**
     * Shows a small, temporary notification toast.
     */
    const fireToast = (icon: ToastIcon, title: string) => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast: HTMLElement) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            },
        });

        Toast.fire({
            icon: icon,
            title: title,
        });
    };

    return { confirmDelete, fireToast };
};