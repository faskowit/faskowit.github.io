# frozen_string_literal: true

# Creates the data behind /coauthors/ from the site's BibTeX bibliography.
# This deliberately uses a small parser instead of adding another build-time
# dependency: Jekyll Scholar already renders the same source bibliography.
require "set"

module CoauthorshipNetwork
  PLACEHOLDER_AUTHORS = ["others", "..."].freeze

  module_function

  def balanced_value(text, opening_brace)
    depth = 0
    text.chars.each_with_index do |character, offset|
      next if offset < opening_brace

      depth += 1 if character == "{"
      depth -= 1 if character == "}"
      return text[(opening_brace + 1)...offset] if depth.zero?
    end
    nil
  end

  def field(entry, name)
    match = entry.match(/(?:\A|[\s,])#{Regexp.escape(name)}\s*=\s*([{"])/i)
    return unless match

    return balanced_value(entry, match.end(0) - 1) if match[1] == "{"

    start = match.end(0)
    finish = start
    finish += 1 while entry[finish] && (entry[finish] != '"' || entry[finish - 1] == "\\")
    entry[start...finish]
  end

  def entries(text)
    records = []
    cursor = 0
    while (match = /@\w+\s*\{\s*([^,\s]+)\s*,/m.match(text, cursor))
      opening_brace = text.index("{", match.begin(0))
      body = balanced_value(text, opening_brace)
      break unless body

      records << { key: match[1], body: body }
      cursor = opening_brace + body.length + 2
    end
    records
  end

  def field_text(entry, name)
    field(entry, name).to_s
         .gsub(/\\[a-zA-Z]+\s*\{([^{}]*)\}/, "\\1")
         .gsub(/\\["'`^~=.uvHcbdkr]\s*\{?([[:alpha:]])\}?/, "\\1")
         .delete("{}")
         .gsub(/\s+/, " ")
         .strip
  end

  def author_identity(author)
    clean = field_text("author={#{author}}", "author")
    return if PLACEHOLDER_AUTHORS.include?(clean.downcase)

    surname, given = clean.split(",", 2).map { |part| part.to_s.strip }
    given = given.to_s
    if given.empty?
      parts = surname.split
      surname = parts.pop.to_s
      given = parts.join(" ")
    end
    initial = given[/[[:alpha:]]/].to_s.downcase
    normalized_surname = surname.downcase.gsub(/[^[:alpha:]]/, "")
    return if normalized_surname.empty? || initial.empty?

    ["#{normalized_surname}|#{initial}", "#{given} #{surname}".strip]
  end

  def graph_from(path)
    records = entries(File.read(path))
    authors = {}
    collaborations = Hash.new { |hash, key| hash[key] = [] }

    records.each do |entry|
      raw_authors = field(entry[:body], "author")
      next unless raw_authors

      paper_authors = raw_authors.split(/\s+and\s+/i).map { |author| author_identity(author) }.compact.uniq
      next if paper_authors.empty?

      paper = { "key" => entry[:key], "title" => field_text(entry[:body], "title"), "year" => field_text(entry[:body], "year") }
      paper_authors.each do |id, name|
        authors[id] ||= { "id" => id, "name" => name, "papers" => [] }
        authors[id]["name"] = name if name.length > authors[id]["name"].length
        authors[id]["papers"] << paper
      end
      paper_authors.combination(2) do |first, second|
        collaborations[[first.first, second.first].sort.join("--")] << paper
      end
    end

    nodes = authors.values.map do |author|
      author.reject { |key, _value| key == "papers" }.merge("publication_count" => author["papers"].length)
    end.sort_by { |author| [-author["publication_count"], author["name"]] }
    links = collaborations.map do |key, papers|
      source, target = key.split("--", 2)
      { "source" => source, "target" => target, "weight" => papers.length, "papers" => papers }
    end.sort_by { |link| [-link["weight"], link["source"], link["target"]] }
    { "nodes" => nodes, "links" => links, "paper_count" => records.length }
  end
end

if defined?(Jekyll::Generator)
  class CoauthorshipNetworkGenerator < Jekyll::Generator
    safe true
    priority :high

    def generate(site)
      bibliography = site.config.dig("scholar", "source") || "_bibliography"
      filename = site.config.dig("scholar", "bibliography") || "papers.bib"
      path = File.join(site.source, bibliography.sub(%r{\A/}, ""), filename)
      site.data["coauthorship_network"] = CoauthorshipNetwork.graph_from(path)
    rescue Errno::ENOENT => error
      Jekyll.logger.warn("Coauthorship network:", error.message)
      site.data["coauthorship_network"] = { "nodes" => [], "links" => [], "paper_count" => 0 }
    end
  end
end
