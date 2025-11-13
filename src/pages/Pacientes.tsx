import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function Pacientes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gestão de pacientes cadastrados</p>
        </div>
        <Button className="bg-gold hover:bg-gold/90 text-gold-foreground">
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Módulo de pacientes em construção</p>
      </Card>
    </div>
  );
}
