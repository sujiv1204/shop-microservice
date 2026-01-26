FROM nginx:alpine

# Copy the HTML file
COPY index.html /usr/share/nginx/html/index.html

# Copy our custom Nginx config to replace the default
COPY nginx.conf /etc/nginx/conf.d/default.conf