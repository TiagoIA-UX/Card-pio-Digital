# Integração do domínio zairyx.com.br

Este checklist cobre a ativação do domínio zairyx.com.br no Zairyx.

## Ajustes já feitos no código

- URL canônica padrão ajustada para [https://zairyx.com.br](https://zairyx.com.br)
- Redirect 308 de [https://www.zairyx.com.br](https://www.zairyx.com.br) para [https://zairyx.com.br](https://zairyx.com.br)
- CORS estático da Vercel apontando para [https://zairyx.com.br](https://zairyx.com.br)
- Scripts de pagamento e SEO atualizados para o domínio novo
- Documentação principal atualizada para o host novo

## Passos externos obrigatórios

1. Adicionar zairyx.com.br ao projeto na Vercel.
2. Adicionar [https://www.zairyx.com.br](https://www.zairyx.com.br) na Vercel, como alias ou redirect.
3. No Registro.br, abrir Configurar endereçamento e publicar os registros DNS exatos fornecidos pela Vercel.
4. Ajustar `NEXT_PUBLIC_SITE_URL` em produção para [https://zairyx.com.br](https://zairyx.com.br).
5. Validar o domínio de envio no Resend antes de usar `alertas@zairyx.com.br`.
6. Atualizar back_urls e webhooks no Mercado Pago se algum estiver fixado fora do software.
7. Atualizar a propriedade do Google Search Console para o domínio novo.

## Validação pós-publicação

1. Abrir [https://zairyx.com.br](https://zairyx.com.br) e confirmar carregamento da home.
2. Abrir [https://www.zairyx.com.br](https://www.zairyx.com.br) e confirmar redirect para [https://zairyx.com.br](https://zairyx.com.br).
3. Validar [https://zairyx.com.br/robots.txt](https://zairyx.com.br/robots.txt).
4. Validar [https://zairyx.com.br/sitemap.xml](https://zairyx.com.br/sitemap.xml).
5. Testar login, cadastro, checkout e webhook de pagamento.
6. Revisar emails transacionais e links do painel admin.

## Observação

O código já está preparado para o domínio novo, mas o Registro.br e a Vercel precisam ser configurados manualmente. Sem isso, o software continuará compilando, porém o domínio não apontará para a aplicação em produção.
