#!/usr/bin/env bash
mkdir -p secrets
openssl genrsa -out secrets/jwt_private.pem 4096
openssl rsa -in secrets/jwt_private.pem -pubout -out secrets/jwt_public.pem
echo "Generated secrets/jwt_private.pem and jwt_public.pem — commit only public key, keep private in secrets manager"
