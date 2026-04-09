import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
    title,
    description,
    canonical,
    ogType = 'website',
    ogImage = '/logo-gold.png',
    keywords = 'moda masculina, syron man, estilo masculino, sãoraimundo nonato'
}) => {
    const siteName = 'SYRON MAN';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const defaultDescription = 'SYRON MAN - A nova definição de estilo masculino em São Raimundo Nonato. Coleções exclusivas e qualidade premium.';

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || defaultDescription} />
            <meta name="keywords" content={keywords} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || defaultDescription} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description || defaultDescription} />
            <meta name="twitter:image" content={ogImage} />

            {/* Canonical link */}
            {canonical && <link rel="canonical" href={canonical} />}
        </Helmet>
    );
};

export default SEO;
