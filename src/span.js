import http from 'k6/http';
import { check } from 'k6';

export let options = {
    vus: 100, // virtual users
    duration: '30s',
};

export default function () {
    const id = __ITER; // unique per iteration
    const payload = JSON.stringify({
        name: `Naim Biswas ${id}`,
        email: `adsdf.+${id}@gmail.com`,
        age: 25,
    });

    const headers = { 'Content-Type': 'application/json' };
    const res = http.post('http://65.2.69.237:3000/users', payload, { headers });
    check(res, { 'status is 200': (r) => r.status === 200 });
}