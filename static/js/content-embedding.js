class ContentEmbedding {
    constructor() {
        if (typeof window.twitterScriptLoaded === 'undefined') {
            window.twitterScriptLoaded = false;
        }
        
        this.embedPatterns = {
            youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g,
            twitter: /https?:\/\/(?:www\.)?twitter\.com\/\w+\/status\/(\d+)/g,
            codepen: /https?:\/\/codepen\.io\/([^\/]+)\/pen\/([a-zA-Z0-9]+)/g,
            jsfiddle: /https?:\/\/jsfiddle\.net\/([^\/]+)\/([a-zA-Z0-9]+)/g,
            maps: /(?:https?:\/\/)?(?:www\.)?google\.com\/maps\/(?:embed\?pb=|place\/)([^&\s]+)/g,
            image: /!\[([^\]]*)\]\(([^)]+)\)/g,
            video: /<video[^>]*src=["']([^"']+)["'][^>]*>/g
        };
        
        this.init();
    }
    
    init() {
        console.log('Content Embedding initialized');
    }
    
    processEmbeds(htmlContent) {
        let processed = htmlContent;
        
        processed = this.embedYouTube(processed);
        processed = this.embedTwitter(processed);
        processed = this.embedCodePen(processed);
        processed = this.embedJSFiddle(processed);
        processed = this.embedMaps(processed);
        processed = this.enhanceImages(processed);
        processed = this.enhanceVideos(processed);
        
        return processed;
    }
    
    embedYouTube(content) {
        return content.replace(this.embedPatterns.youtube, (match, videoId) => {
            return `<div class="embed-container youtube-embed">
                <iframe width="100%" height="400" 
                    src="https://www.youtube.com/embed/${videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>`;
        });
    }
    
    embedTwitter(content) {
        const hasTwitterEmbed = this.embedPatterns.twitter.test(content);
        
        if (hasTwitterEmbed && !window.twitterScriptLoaded) {
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            document.body.appendChild(script);
            window.twitterScriptLoaded = true;
        }
        
        return content.replace(this.embedPatterns.twitter, (match, tweetId) => {
            return `<div class="embed-container twitter-embed">
                <blockquote class="twitter-tweet" data-theme="dark">
                    <a href="https://twitter.com/x/status/${tweetId}"></a>
                </blockquote>
            </div>`;
        });
    }
    
    embedCodePen(content) {
        return content.replace(this.embedPatterns.codepen, (match, user, penId) => {
            return `<div class="embed-container codepen-embed">
                <iframe height="400" style="width: 100%;" scrolling="no" 
                    src="https://codepen.io/${user}/embed/${penId}?height=400&theme-id=dark&default-tab=result" 
                    frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
                </iframe>
            </div>`;
        });
    }
    
    embedJSFiddle(content) {
        return content.replace(this.embedPatterns.jsfiddle, (match, user, fiddleId) => {
            return `<div class="embed-container jsfiddle-embed">
                <iframe width="100%" height="400" 
                    src="https://jsfiddle.net/${user}/${fiddleId}/embedded/result,html,css,js/dark/" 
                    allowfullscreen="allowfullscreen" frameborder="0">
                </iframe>
            </div>`;
        });
    }
    
    embedMaps(content) {
        return content.replace(this.embedPatterns.maps, (match, location) => {
            return `<div class="embed-container maps-embed">
                <iframe width="100%" height="400" 
                    src="https://www.google.com/maps/embed?pb=${location}" 
                    frameborder="0" style="border:0;" allowfullscreen="" loading="lazy">
                </iframe>
            </div>`;
        });
    }
    
    enhanceImages(content) {
        return content.replace(/<img([^>]*)src=["']([^"']+)["']([^>]*)>/g, (match, before, src, after) => {
            const alt = (before + after).match(/alt=["']([^"']+)["']/);
            const altText = alt ? alt[1] : 'Image';
            
            return `<div class="enhanced-image-container">
                <img${before}src="${src}"${after} loading="lazy" onclick="window.open('${src}', '_blank', 'noopener,noreferrer')">
                <div class="image-caption">${altText}</div>
            </div>`;
        });
    }
    
    enhanceVideos(content) {
        return content.replace(/<video([^>]*)src=["']([^"']+)["']([^>]*)>/g, (match, before, src, after) => {
            return `<div class="enhanced-video-container">
                <video${before}src="${src}"${after} controls preload="metadata">
                    Your browser does not support the video tag.
                </video>
            </div>`;
        });
    }
    
    embedPDF(url, container) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="pdf-viewer-container">
                <div class="pdf-viewer-toolbar">
                    <button onclick="window.open('${url}', '_blank')" class="pdf-btn">
                        <i data-feather="external-link"></i> Open in New Tab
                    </button>
                </div>
                <iframe src="${url}" width="100%" height="600px" frameborder="0">
                    <p>Your browser does not support PDFs. 
                    <a href="${url}">Download the PDF</a>.</p>
                </iframe>
            </div>
        `;
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentEmbedding;
}

window.ContentEmbedding = ContentEmbedding;
