import { useEffect, useState } from 'react';
import { MOBILE_BREAKPOINT } from '@/lib/constants';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

/**
 * Hook consolidado para detecção de dispositivo.
 * Combina User-Agent (tipo de dispositivo) + media query (breakpoint).
 *
 * Substitui tanto o antigo useDeviceDetection quanto use-mobile.tsx.
 */
export const useDeviceDetection = () => {
    const [device, setDevice] = useState<DeviceType>('desktop');
    const [isMobileScreen, setIsMobileScreen] = useState(false);

    useEffect(() => {
        const detectDevice = () => {
            const userAgent = navigator.userAgent.toLowerCase();

            if (/ipad|android(?!.*mobile)/.test(userAgent)) {
                setDevice('tablet');
                return;
            }

            if (/iphone|ipod|android|windows phone/.test(userAgent)) {
                setDevice('mobile');
                return;
            }

            setDevice('desktop');
        };

        detectDevice();

        window.addEventListener('orientationchange', detectDevice);
        window.addEventListener('resize', detectDevice);

        return () => {
            window.removeEventListener('orientationchange', detectDevice);
            window.removeEventListener('resize', detectDevice);
        };
    }, []);

    // Media query para breakpoint (substitui use-mobile.tsx)
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = () => setIsMobileScreen(window.innerWidth < MOBILE_BREAKPOINT);

        mql.addEventListener('change', onChange);
        setIsMobileScreen(window.innerWidth < MOBILE_BREAKPOINT);

        return () => mql.removeEventListener('change', onChange);
    }, []);

    return {
        device,
        isMobile: device === 'mobile',
        isTablet: device === 'tablet',
        isDesktop: device === 'desktop',
        isMobileScreen, // true quando tela < 768px (independente do dispositivo)
    };
};

/**
 * Alias para compatibilidade com shadcn/ui sidebar.tsx
 * que importa useIsMobile de use-mobile.
 */
export function useIsMobile(): boolean {
    const { isMobileScreen } = useDeviceDetection();
    return isMobileScreen;
}
