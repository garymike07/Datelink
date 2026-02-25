// Quick script to check if environment variables are loading
console.log('Environment variable check:');
console.log('VITE_VAPID_PUBLIC_KEY:', import.meta.env.VITE_VAPID_PUBLIC_KEY);
console.log('Is placeholder?', import.meta.env.VITE_VAPID_PUBLIC_KEY === 'PLACEHOLDER_VAPID_KEY');
console.log('Full import.meta.env:', import.meta.env);
