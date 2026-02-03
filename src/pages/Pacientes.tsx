import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { usePatientsPaginated, Patient } from "@/hooks/usePatients";
import { PatientList } from "@/components/pacientes/PatientList";
import { PatientForm } from "@/components/pacientes/PatientForm";
import { PatientDetailPanel } from "@/components/pacientes/PatientDetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const PAGE_SIZE = 20;

export default function Pacientes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const patientIdParam = searchParams.get("id");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [searchParams]);

  const { data: patientFromParam } = useQuery({
    queryKey: ["patient-by-id", patientIdParam],
    queryFn: async () => {
      if (!patientIdParam) return null;
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientIdParam)
        .maybeSingle();
      if (error) throw error;
      return data as Patient | null;
    },
    enabled: !!patientIdParam,
  });

  useEffect(() => {
    if (patientFromParam) {
      setSelectedPatient(patientFromParam);
      setDetailPanelOpen(true);
    }
  }, [patientFromParam]);
  
  const { data: paginatedData, isLoading } = usePatientsPaginated({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    active: true,
  });

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailPanelOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const handleDetailPanelClose = (open: boolean) => {
    setDetailPanelOpen(open);
    if (!open) {
      setSelectedPatient(null);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    if (!paginatedData) return [];
    const { totalPages, currentPage } = paginatedData;
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">
            {paginatedData?.totalCount ?? 0} pacientes cadastrados
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      <PatientList 
        patients={paginatedData?.data || []} 
        onPatientClick={handlePatientClick} 
      />

      {/* Pagination */}
      {paginatedData && paginatedData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((page - 1) * PAGE_SIZE) + 1} a {Math.min(page * PAGE_SIZE, paginatedData.totalCount)} de {paginatedData.totalCount} pacientes
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!paginatedData.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              </PaginationItem>
              
              {getPageNumbers().map((pageNum, idx) => (
                <PaginationItem key={idx}>
                  {pageNum === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={page === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!paginatedData.hasNextPage}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
          </DialogHeader>
          <PatientForm onSuccess={handleCloseCreateDialog} onCancel={handleCloseCreateDialog} />
        </DialogContent>
      </Dialog>

      <PatientDetailPanel
        patient={selectedPatient}
        open={detailPanelOpen}
        onOpenChange={handleDetailPanelClose}
      />
    </div>
  );
}
