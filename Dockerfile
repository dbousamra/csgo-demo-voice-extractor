FROM cm2network/steamcmd:root

# Using Debian, as root
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
  apt-get install -y nodejs build-essential && \
  npm install --global yarn

WORKDIR /app