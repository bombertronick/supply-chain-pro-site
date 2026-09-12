-- gen616: 5 zone cambiate, 11 tessere
-- 8799c5d2ae02533bd7aee1cb2f06ce5e (986015) → cf97cfd7ced5c37f3d7d468d9486d5bb (988312)

insert into kv_store(key, value) select 'backup:pre-gen616', value from kv_store where key='app:jsx:src'
  on conflict (key) do update set value=excluded.value;

insert into kv_store(key, value) values('tmp:gen616:p001', substr((select value from kv_store where key='app:jsx:src'), 1, 40780)) on conflict (key) do update set value=excluded.value;
insert into kv_store(key, value) values('tmp:gen616:p002', convert_from(decode('Y29uc3QgVkVSU0lPTkUgPSAiZ2VuLTYuMTYiOwo=', 'base64'), 'UTF8')) on conflict (key) do update set value=excluded.value;
insert into kv_store(key, value) values('tmp:gen616:p003', substr((select value from kv_store where key='app:jsx:src'), 40810, 917371)) on conflict (key) do update set value=excluded.value;
insert into kv_store(key, value) values('tmp:gen616:p004', convert_from(decode('ICAgICAgLyogwqs+IDHCuyBlIG5vbiDCqz4gMMK7LCBlZCBlJyBkZWxpYmVyYXRvOiB1bm8gc3RhdG8gYXBwZW5hIHNlbWluYXRvIGhhCiAgICAgICAgIHJldiAxLCBlIGlsIHJhbW8gZGVsIHByaW1vIGF2dmlvIChwaXUnIHNvdHRvKSBxdWFuZG8gbGEgc2NyaXR0dXJhIGRlbAogICAgICAgICBzZW1lIGZhbGxpc2NlIEFDQ09EQSB1biBsYXZvcm8gdnVvdG8gZSBjaGlhbWEgcXVpLiBDb24gwqs+IDDCuyBxdWVsbGEKICAgICAgICAgY2hpYW1hdGEgYXJyb3NzaXJlYmJlIHBlciBzZW1wcmUgZSB1bidpbnN0YWxsYXppb25lIG51b3ZhIG5vbgogICAgICAgICBmaW5pcmViYmUgbWFpIGRpIG5hc2NlcmUuIFNlbWJyYSB1bmEgbWFnbGlhIGxhcmdhIGUgbm9uIGxvIGUnOiBpbAogICAgICAgICBndXNjaW8sIGNoZSBlcmEgaWwgdmVybyBidWNvLCBsbyBwcmVuZGUgbGEgZ3VhcmRpYSBzb3R0byAoZ2VuLTYuMTYpLiAqLwo=', 'base64'), 'UTF8')) on conflict (key) do update set value=excluded.value;
insert into kv_store(key, value) values('tmp:gen616:p005', substr((select value from kv_store where key='app:jsx:src'), 958181, 561)) on conflict (key) do update set value=excluded.value;
insert into kv_store(key, value) values('tmp:gen616:p006', convert_from(decode('ICAgICAgLyog4pSA4pSAIE5PTiBTSSBTQ1JJVkUgU1UgVU4gR1VTQ0lPIChnZW4tNi4xNikg4pSA4pSACiAgICAgICAgIExhIGd1YXJkaWEgcXVpIHNvcHJhIGNoaWVkZSB1bmEgUkVWLCBlIHVuIGd1c2NpbyBsYSByZXYgbm9uIGNlIGwnaGE6CiAgICAgICAgIHJpc3BvbmRldmEgMCBlIHBhc3NhdmEuIERhIGxpJyBiYXN0YXZhIFVOQSBtdXRhemlvbmUgcXVhbHNpYXNpIOKAlCB1bgogICAgICAgICBhZG1pbiBjaGUsIHZlZGVuZG8gbGUgbGlzdGUgdnVvdGUsIGNyZWEgdW5hIHNlZGUg4oCUIHBlciBtYW5kYXJlIGluCiAgICAgICAgIHJldGUgdW5vIHN0YXRvIHNlbnphIG1hZ2F6emluaSBlIHNlbnphIHByb2RvdHRpLCBjb24gcmV2QmFzZSAwLiBJbAogICAgICAgICBiYW5jbyBsbyBtaXN1cmE6IDUgbWFnYXp6aW5pIGUgMTAzIHByb2RvdHRpIGRpdmVudGF2YW5vIDAuCiAgICAgICAgIEluIHByb2R1emlvbmUgbG8gZmVybWEgaWwgY2FuY2VsbG8gZGVudHJvIGlsIGRhdGFiYXNlLCBtYQogICAgICAgICBzdHJ1bWVudGkvc2VydmVyL2FwcF9rdl9zZXQuc3FsIGF2dmVydGUgZGEgc29sbyBjaGUgc2UgaWwgZGF0YWJhc2UKICAgICAgICAgdmVuaXNzZSByaWNvc3RydWl0byBzZW56YSBkaSBsdWkgwqtzaSB0b3JuZXJlYmJlIGFsIGRpZmV0dG8gZGkgcHJpbWEKICAgICAgICAgU0VOWkEgY2hlIG5pZW50ZSBkaXZlbnRpIHJvc3NvwrsuIFF1ZXN0YSBlJyBsYSBkaWZlc2EgY2hlIG1hbmNhdmEKICAgICAgICAgREVOVFJPIGwnYXBwLCBlIG5vbiBjaGllZGUgbmllbnRlIGFsIHRyYXNwb3J0bzogY2hpZWRlIGFsbGEgYmFzZSBkYQogICAgICAgICBkb3ZlIHZpZW5lLiBWYSBET1BPIGxhIHNjZWx0YSBkZWxsYSBiYXNlLCBub24gcHJpbWEsIHBlcmNoZScgcXVhbmRvCiAgICAgICAgIGJhc2VSZWYgZScgbnVsbG8gc2kgcmljYWRlIHN1IHN0YXRvUmVmIOKAlCBjaGUgZScgbG8gc3Rlc3NvIGd1c2Npby4gKi8KICAgICAgaWYgKGJhc2UgJiYgKGJhc2UuX19ndXNjaW8gfHwgYmFzZS5fX3ByZWxvZ2luKSkKICAgICAgICB0aHJvdyBuZXcgRXJyb3IoImJhc2Ugbm9uIGF0dGVuZGliaWxlOiBub24gc2kgZScgbGV0dGEgbGEgcmV0ZSIpOwo=', 'base64'), 'UTF8')) on conflict (key) do update set value=excluded.value;
insert into kv_store(key, value) values('tmp:gen616:p007', substr((select value from kv_store where key='app:jsx:src'), 958742, 19664)) on conflict (key) do update set value=excluded.value;
insert into kv_store(key, value) values('tmp:gen616:p008', convert_from(decode('ICAgICAgICAvKiDilIDilIAgSUwgR1VTQ0lPIFNJIE1BUkNBIChnZW4tNi4xNikg4pSA4pSACiAgICAgICAgICAgUXVhbmRvIGlsIFBJTiBwYXNzYSBtYSBpIGRhdGkgbm8sIHF1ZXN0byBub24gZScgdW5vIHN0YXRvOiBlJyB1bgogICAgICAgICAgIGd1c2NpbywgbGUgbGlzdGUgdnVvdGUgZGkgbm9ybWFsaXp6YSBwaXUnIGkgc29saSBub21pLiBJbCBndXNjaW8KICAgICAgICAgICBkZWxsYSBzY2hlcm1hdGEgZGVpIG5vbWkgcG9ydGEgZ2lhJyDCq19fcHJlbG9naW7CuzsgcXVlc3RvLCBjaGUgZScKICAgICAgICAgICBsJ3VuaWNvIGNoZSBmaW5pc2NlIGluIGJhc2VSZWYsIG5vbiBwb3J0YXZhIG5pZW50ZSDigJQgZSB1bmEgYmFzZQogICAgICAgICAgIHNlbnphIG5vbWUgZScgdW5hIGJhc2UgY2hlIHF1YWxjdW5vIHByaW1hIG8gcG9pIHVzYS4gKi8KICAgICAgICBjb25zdCBzID0gbGV0dG8gPyBub3JtYWxpenphKGxldHRvKSA6IG5vcm1hbGl6emEoeyBwcm9maWxpOiBzdGF0b1JlZi5jdXJyZW50Py5wcm9maWxpIHx8IFtdLCBfX2d1c2NpbzogdHJ1ZSB9KTsK', 'base64'), 'UTF8')) on conflict (key) do update set value=excluded.value;
insert into kv_store(key, value) values('tmp:gen616:p009', substr((select value from kv_store where key='app:jsx:src'), 978510, 1221)) on conflict (key) do update set value=excluded.value;
insert into kv_store(key, value) values('tmp:gen616:p010', convert_from(decode('ICAgICAgICAvKiBlIGxhIHBhc3RpZ2xpYSBkaWNlIHF1ZWxsbyBjaGUgU0EuIFNlbnphIGxhIGxldHR1cmEsIMKrb2vCuyBlJyB1bmEKICAgICAgICAgICBidWdpYTogbGUgbGlzdGUgc29ubyB2dW90ZSBwZXJjaGUnIG5vbiBzaSBlJyByaXVzY2l0aSBhIGxlZ2dlcmxlLAogICAgICAgICAgIG5vbiBwZXJjaGUnIG5vbiBjaSBzaWEgbmllbnRlLiBOb24gwqtzYWx2YXRhZ2dpb8K7LCBjaGUgaW4gcXVlc3RhCiAgICAgICAgICAgY2FzYSB2dW9sIGRpcmUgwqtjJ2UnIGxhdm9ybyBpbiB2b2xvwrs6IMKrb2ZmbGluZcK7IChnZW4tNi4xNikuICovCiAgICAgICAgc2V0U3luYyghbGV0dG8gPyAib2ZmbGluZSIgOiAoY29kYVJlZi5jdXJyZW50Lmxlbmd0aCA/ICJzYWx2YXRhZ2dpbyIgOiAib2siKSk7Cg==', 'base64'), 'UTF8')) on conflict (key) do update set value=excluded.value;
insert into kv_store(key, value) values('tmp:gen616:p011', substr((select value from kv_store where key='app:jsx:src'), 979795, 6221)) on conflict (key) do update set value=excluded.value;

-- il cancello, PRIMA di scrivere
select md5(string_agg(value, '' order by key)) as md5_ricomposto,
       length(string_agg(value, '' order by key)) as len_ricomposto,
       md5(string_agg(value, '' order by key)) = 'cf97cfd7ced5c37f3d7d468d9486d5bb' as combacia
from kv_store where key like 'tmp:gen616:p%';

update kv_store set value = (select string_agg(value, '' order by key) from kv_store where key like 'tmp:gen616:p%')
where key='app:jsx:src'
  and md5(value) = '8799c5d2ae02533bd7aee1cb2f06ce5e'
  and (select md5(string_agg(value, '' order by key)) from kv_store where key like 'tmp:gen616:p%') = 'cf97cfd7ced5c37f3d7d468d9486d5bb';

update kv_store set value = '{"len":988312,"ver":"gen-6.16"}'
where key='app:jsx:meta'
  and (select md5(value) from kv_store where key='app:jsx:src') = 'cf97cfd7ced5c37f3d7d468d9486d5bb';

delete from kv_store where key like 'tmp:gen616:p%';
