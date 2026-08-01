import { Variants } from 'framer-motion'

export const transition = {
    type: 'spring',
    stiffness: 380,
    damping: 30
}

export const fadeIn: Variants = {
    initial: {
        opacity: 0
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.3,
            ease: 'easeOut'
        }
    }
}

export const slideInLeft: Variants = {
    initial: {
        opacity: 0,
        x: -20
    },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.35,
            ease: [0.16, 1, 0.3, 1]
        }
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: {
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1]
        }
    }
}

export const slideInRight: Variants = {
    initial: {
        opacity: 0,
        x: '100%'
    },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1]
        }
    },
    exit: {
        opacity: 0,
        x: '100%',
        transition: {
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1]
        }
    }
}

export const slideInUp: Variants = {
    initial: {
        opacity: 0,
        y: 12
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.35,
            ease: [0.16, 1, 0.3, 1]
        }
    }
}

export const staggerContainer: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.05
        }
    }
}

export const scaleIn: Variants = {
    initial: {
        opacity: 0,
        scale: 0.95,
        y: 8
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1]
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 8,
        transition: {
            duration: 0.18,
            ease: 'easeIn'
        }
    }
}

export const fadeInOut: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.15, ease: 'easeIn' }
    }
}
