import Particles from '@tsparticles/react';

export default function ParticleBackground() {

  return (
    <Particles
      id="tsparticles"
      particlesLoaded={async () => {}}
      options={{
        fullScreen: {
          enable: false,
          zIndex: -1,
        },
        background: {
          color: {
            value: 'transparent',
          },
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onClick: {
              enable: true,
              mode: 'push',
            },
            onHover: {
              enable: true,
              mode: 'grab',
              parallax: {
                enable: true,
                force: 60,
                smooth: 10,
              },
            },
            resize: {
              enable: true
            },
          },
          modes: {
            push: {
              quantity: 4,
            },
            grab: {
              distance: 200,
              line_linked: {
                opacity: 0.5,
              },
            },
          },
        },
        particles: {
          color: {
            value: ['#89b4fa', '#cba6f7', '#f38ba8', '#a6e3a1'],
          },
          links: {
            color: '#89b4fa',
            distance: 150,
            enable: true,
            opacity: 0.2,
            width: 1,
          },
          move: {
            direction: 'none',
            enable: true,
            outModes: {
              default: 'bounce',
            },
            random: false,
            speed: 2,
            straight: false,
            attract: {
              enable: true,
              rotate: {
                x: 600,
                y: 1200
              }
            },
          },
          number: {
            density: {
              enable: true
            },
            value: 60,
          },
          opacity: {
            value: 0.3,
            animation: {
              enable: true,
              speed: 1,
              sync: false
            },
          },
          shape: {
            type: 'circle',
          },
          size: {
            value: { min: 1, max: 3 },
            animation: {
              enable: true,
              speed: 2,
              sync: false
            },
          },
        },
        detectRetina: true,
      }}
    />
  );
}